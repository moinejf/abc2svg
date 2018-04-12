// edit.js - file used in the abc2svg editor
//
// Copyright (C) 2014-2018 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

window.onerror = function(msg, url, line) {
	if (typeof msg == 'string')
		alert("window error: " + msg +
			"\nURL: " + url +
			"\nLine: " + line)
	else if (typeof msg == 'object')
		alert("window error: " + msg.type + ' ' + msg.target.src)
	else
		alert("window error: " + msg)
	return false
}

var	abc_images,			// image buffer
	abc_fname = ["noname.abc", ""],	// file names
	abc,				// Abc object
	ref,				// source reference array
	elt_ref = {},			// pointers to page elements
	colcl = [],			// colorized classes
	colcl_sav,			// (saved while playing/printing)
	abcplay,			// play engine
	a_pe,				// playing events
	playing,
	selrec = {},
	pop,				// current popup message
	texts = {			// language specific texts
		bad_nb: 'Bad line number',
		fn: 'File name: ',
		load: 'Please, load the included file ',
		play: 'Play',
		stop: 'Stop'
	}

// -- Abc create argument
var user = {
	// -- required methods
	// include a file (%%abc-include - only one)
	read_file: function(fn) {
		elt_ref["s" + srcidx].style.display = "inline"
		return elt_ref.src1.value
	},
	// insert the errors
	errmsg: function(msg, l, c) {
		msg = clean_txt(msg)
		if (l)
			elt_ref.diverr.innerHTML += '<b onclick="gotoabc(' +
				l + ',' + c +
				')" style="cursor: pointer; display: inline-block">' +
				msg + "</b><br/>\n"
		else
			elt_ref.diverr.innerHTML += msg + "<br/>\n"
	},
	// image output
	my_img_out: function(str) {
		abc_images += str
	},
	// -- optional methods
	// annotations
	anno_stop: function(type, start, stop, x, y, w, h) {
		if (["beam", "slur", "tuplet"].indexOf(type) >= 0)
			return
		ref[start] = stop;		// keep the source reference

		// create a rectangle
		abc.out_svg('<rect class="abcr _' + start +
			'_" x="');
		abc.out_sxsy(x, '" y="', y);
		abc.out_svg('" width="' + w.toFixed(2) +
			'" height="' + abc.sh(h).toFixed(2) + '"/>\n')
// with absolute coordinates, the rectangles would be inserted at the end
// of the images as:
//  '<rect class="abcr _' + start +
//	'_" x="' + abc.ax(x).toFixed(2) + '" y="' + abc.ay(y).toFixed(2) +
//	'" width="' + w.toFixed(2) +
//	'" height="' + abc.ah(h).toFixed(2) + '"/>\n'
	},
	// -- optional attributes
	page_format: true		// define the non-page-breakable blocks
    },
    srcidx = 0

// -- local functions

// Storage handling
function storage(t,		// session or local
		 k, v) {
	try {
		t = t ? localStorage : sessionStorage
		if (!t)
			return
		if (v)
			t.setItem(k, v)
		else if (v === 0)
			t.removeItem(k)
		else
			return t.getItem(k)
	} catch(e) {
	}
}

// replace <>& by XML character references
function clean_txt(txt) {
	return txt.replace(/<|>|&.*?;|&/g, function(c) {
		switch (c) {
		case '<': return "&lt;"
		case '>': return "&gt;"
		case '&': return "&amp;"
		}
		return c
	})
}

// load a javascript file
    var jsdir = document.currentScript.src.match(/.*\//)
function loadjs(fn, relay, onerror) {
	var s = document.createElement('script');
	s.src = jsdir + fn;
	s.type = 'text/javascript'
	if (relay)
		s.onload = relay;
	s.onerror = onerror || function() {
		alert('error loading ' + fn)
	}
	document.head.appendChild(s)
}

// load the language files ('edit-lang.js' and 'err-lang.js')
function loadlang(lang, no_memo) {
	loadjs('edit-' + lang + '.js', function() { loadtxt() });
	loadjs('err-' + lang + '.js')
	if (!no_memo)
		storage(true, "lang", lang == "en" ? 0 : lang)
}

// show/hide a popup message
function popshow(area, visible) {
	var e = document.getElementById(area)
	if (pop)
		pop.style.visibility = 'hidden';
	e.style.visibility = visible ? 'visible' : 'hidden';
	pop = visible ? e : null
}

// load the (ABC source or include) file in the textarea
function loadtune() {
	var files = document.getElementById("abcfile").files
//	if (!files.length) {
//		alert('Please select a file!')
//		return
//	}
	abc_fname[srcidx] = files[0].name

	var reader = new FileReader();

	// Closure to capture the file information
	reader.onloadend = function(evt) {
		var	i, j, sl,
			content = evt.target.result,
			s = srcidx == 0 ? "source" : "src1"
		elt_ref[s].value = content;
		elt_ref["s" + srcidx].value = abc_fname[srcidx];
		src_change()
	}

	// Read the file as text
	reader.readAsText(files[0], "UTF-8")
}

// display the source 0 or 1
function selsrc(idx) {
	if (idx == srcidx)
		return
	var	o = srcidx ? "src" + srcidx : "source",
		n = idx ? "src" + idx : "source";
	elt_ref[o].style.display = "none";
	elt_ref[n].style.display = "inline";
	elt_ref["s" + srcidx].style.backgroundColor = "#ffd0d0";
	elt_ref["s" + idx].style.backgroundColor = "#80ff80";
	srcidx = idx
}

// render the textarea content to the right side
function render() {
    var	i, j,
	content = elt_ref.source.value;

	a_pe = null
	if (!content)
		return			// empty source

	// if include file not loaded yet, ask it
	i = content.indexOf('%%abc-include ')
	if (i >= 0) {
		var sl = elt_ref.s1
		if (!sl.value) {
			sl.style.display = "inline";
			j = content.indexOf('\n', i);
			sl.value = content.slice(i + 14, j);
			selsrc(1);
			alert(texts.load + sl.value)
			return
		}
	}
	elt_ref.diverr.innerHTML = '';
	render2()
}
function render2() {
    var	i,
	target = document.getElementById("target"),
	content = elt_ref.source.value

	// load the required modules
	if (!modules.load(content + elt_ref.src1.value,
			null, render2))
		return

	user.img_out = user.my_img_out;
	user.get_abcmodel = null;

	abc = new Abc(user);
	abc_images = '';
	abc.tosvg('edit', '%%bgcolor white');

//	document.body.style.cursor = "wait";
	ref = []
	try {
		abc.tosvg(abc_fname[0], content)
	} catch(e) {
		alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack)
		return
	}
//	document.body.style.cursor = "auto";

	try {
		target.innerHTML = abc_images
	} catch(e) {
		alert(e.message + '\nabc2svg image bug - abort')
		return
	}

	// show the 'Error' button if some error
	document.getElementById("er").style.display =
				elt_ref.diverr.innerHTML ? 'inline' : 'none';

	// set the callbacks in the SVG images
	setTimeout(function(){
		var	elts = target.getElementsByClassName('abcr'),
			i = elts.length,
			elt
		elts = target.getElementsByTagName("svg");
		i = elts.length
		while (--i >= 0) {
			elt = elts[i];
			elt.onmousedown = svgsel
		}
	}, 300)
}

// select a source ABC element
function gotoabc(l, c) {
	var	s = elt_ref.source,
		idx = 0;
	selsrc(0)
	while (--l >= 0) {
		idx = s.value.indexOf('\n', idx) + 1
		if (idx <= 0) {
			alert(texts.bad_nb);
			idx = s.value.length - 1;
			c = 0
			break
		}
	}
	c = Number(c) + idx;
	s.focus();
	s.setSelectionRange(c, c + 1)
}

// highlight the music element on mouse over
function m_over(elt) {
	if (selrec.rect)
		return
	if (colcl.length > 1)
		return
	colorsel(false)
	var cl = elt.getAttribute('class');
	colcl = [cl.split(' ')[1]];	// cl[0]:'abcr', cl[1]:elt ref
	colorsel(true)
}

// select elements in an image
function svgsel(evt) {
var	pt, nr, i, elts, elt, x, y, cl,
	svg = evt.target

	while (svg.tagName != 'svg') {
		svg = svg.parentNode
		if (!svg)
			return
	}

	switch (evt.type) {
	case "mousedown":
		if (selrec.rect) {
			selrec.rect.parentNode.removeChild(selrec.rect);
			selrec.rect = null
		}
		colorsel(false);
		window.getSelection().removeAllRanges();
		svg.onmousemove = svgsel;
		svg.onmouseup = svgsel;
		pt = svg.createSVGPoint();
		pt.x = evt.clientX;
		pt.y = evt.clientY;
		cl = pt.matrixTransform(svg.getScreenCTM().inverse());
		selrec.xs = cl.x;
		selrec.ys = cl.y;

		evt.stopImmediatePropagation();
		evt.preventDefault()
		break
	case "mousemove":
		pt = svg.createSVGPoint();
		pt.x = evt.clientX;
		pt.y = evt.clientY;
		cl = pt.matrixTransform(svg.getScreenCTM().inverse());
		selrec.x = cl.x;
		selrec.y = cl.y

		if (!selrec.rect) {
			nr = true;
			selrec.rect = document.createElementNS("http://www.w3.org/2000/svg",
								'rect');
			selrec.rect.setAttribute("x", selrec.xs);
			selrec.rect.setAttribute("y", selrec.ys);
		}
		if (selrec.x > selrec.xs && selrec.y > selrec.ys) {
			selrec.rect.setAttribute("width", selrec.x - selrec.xs);
			selrec.rect.setAttribute("height",selrec.y - selrec.ys)
		}
		if (nr) {
			selrec.rect.setAttribute("fill", "none");
			selrec.rect.setAttribute("stroke", "blue");
			svg.appendChild(selrec.rect)
		}
		evt.stopImmediatePropagation();
		evt.preventDefault()
		break
	case "mouseup":
//	case "mouseout":
		svg.onmousemove = null;
		svg.onmouseup = null
		if (!selrec.rect) {
			svg = evt.target
			cl = svg.getAttribute('class')
			if (cl && cl.substr(0, 4) == 'abcr')
				m_over(svg)
			break
		}
		svg.removeChild(selrec.rect);

		// define the selection
// (svg.getEnclosureList does not work)
		elts = svg.getElementsByClassName("abcr");
		i = elts.length
		while (--i >= 0) {
			elt = elts[i];
			x = Number(elt.getAttribute("x"))
			y = Number(elt.getAttribute("y"))
			if (x < selrec.xs
			 || y < selrec.ys
			 || x + Number(elt.getAttribute("width")) > selrec.x
			 || y + Number(elt.getAttribute("height")) > selrec.y)
				continue
			cl = elt.getAttribute("class");
			colcl.push(cl.split(' ')[1])
		}
		selrec.rect = null;
		colorsel(true);
		evt.stopImmediatePropagation();
		evt.preventDefault()
		break
	}
}

// colorize the selection
function colorsel(on, nosel) {
var	i, j, elts, d,
	i1 = 1000000,	// (hope a ABC file is smaller than that!)
	i2 = 0,
	n = colcl.length

	for (i = 0; i < n; i++) {
		elts = document.getElementsByClassName(colcl[i]);
		j = elts.length
		while (--j >= 0)
			elts[j].style.fillOpacity = on ? 0.4 : 0
		if (on) {
			d = colcl[i].split('_')
			if (d[1] < i1)
				i1 = d[1]
			if (ref[d[1]] > i2)
				i2 = ref[d[1]]
		}
	}
	if (!nosel && i1 < i2) {
		var s = elt_ref.source;
		selsrc(0);
		s.setSelectionRange(i1, i2);
		s.blur();
		s.focus()
	}
	if (!on)
		colcl = []
}

// source text selection callback
function seltxt(elt) {
	var	start, end, s, z, elts
	if (colcl.length != 0)
		colorsel(false);
	if (elt.selectionStart == undefined)
		return
	start = elt.selectionStart;
	end = elt.selectionEnd
	if (start == 0
	 && end == elt_ref.source.value.length)
		return				// select all
	if (ref) {
		ref.forEach(function(e, o) {
			if (o >= start && e <= end)
				colcl.push('_' + o + '_')
		})
	}
	if (colcl.length != 0) {
		colorsel(true, true);
		s = document.getElementById("dright");
	  z = window.document.defaultView.getComputedStyle(s).getPropertyValue('z-index')
		if (z != 10) {			// if select from textarea
			elts = document.getElementsByClassName(colcl[0]);
			if (elts[0])
				elts[0].scrollIntoView() // move the element on the screen
		}
	}
}

// open a new window for file save
function saveas() {      
	var	s = srcidx == 0 ? "source" : "src1",
		source = elt_ref[s].value,
		uriContent = "data:text/plain;charset=utf-8," +
				encodeURIComponent(source),

	// create a link for our script to 'click'
		link = document.createElement("a");

	elt_ref["s" + srcidx].value =
		link.download =
			abc_fname[srcidx] =
				prompt(texts.fn, abc_fname[srcidx]);
	link.innerHTML = "Hidden Link";	
	link.href = uriContent;

	// open in a new tab
	link.target = '_blank';

	// when link is clicked call a function to remove it from
	// the DOM in case user wants to save a second file.
	link.onclick = destroyClickedElement;

	// make sure the link is hidden.
	link.style.display = "none";

	// add the link to the DOM
	document.body.appendChild(link);
    
	// click the new link
	link.click()
}

// destroy the clicked element
function destroyClickedElement(evt) {
	document.body.removeChild(evt.target)
}

// set the size of the font of the textarea
function setfont() {
    var	fs = document.getElementById("fontsize").value.toString();
	elt_ref.source.style.fontSize =
		elt_ref.src1.style.fontSize = fs + "px";
	storage(true, "fontsz", fs == "14" ? 0 : fs)
}

// playing
// set 'follow music'
function set_follow(e) {
	abcplay.set_follow(e.checked)
	storage(true, "follow", e.checked == "1" ? 0 : "0")
}
// set soundfont URL
function set_sfu(v) {
	abcplay.set_sfu(v)
	storage(true, "sfu", v == "Scc1t2" ? 0 : v)
}
// set_speed value = 1..20, 10 = no change
function set_speed(iv) {
    var	spvl = document.getElementById("spvl"),
	v = Math.pow(3,			// max 3 times lower/faster
			(iv - 10) * .1);
	abcplay.set_speed(v);
	spvl.innerHTML = v
}
// set volume
function set_vol(v) {
    var	gvl = document.getElementById("gvl");
	gvl.innerHTML = v.toFixed(2);
	abcplay.set_vol(v)
	storage(true, "volume", v == 0.7 ? 0 : v.toFixed(2))
}
//fixme: do tune/start-stop selection of what to play
function notehlight(i, on) {
	var elts = document.getElementsByClassName('_' + i + '_');
	if (elts && elts[0])
		elts[0].style.fillOpacity = on ? 0.4 : 0
}
function endplay() {
	document.getElementById("playbutton").innerHTML = texts.play;
	playing = false;
	colcl = colcl_sav;
	colorsel(true)
}
function play_tune() {
    var	pe

	function build_pe() {
	    var	i, e,
		set = {}

		pe = []
		for (i = 0; i < colcl.length; i++) {
			e = colcl[i].slice(1, -1)
			set[e] = true
		}
		for (i = 0; i < a_pe.length; i++) {
			e = a_pe[i]
			if (set[e[0]])
				pe.push(e)
		}
	} // build_pe()

	if (playing) {
		abcplay.stop();
		return
	}
	playing = true;
	if (!a_pe) {			// if no playing event
		user.img_out = null	// get the schema and stop SVG generation
		user.get_abcmodel = abcplay.add	// inject the model in the play engine

		var abc = new Abc(user);

		abcplay.clear();
		abc.tosvg("play", "%%play")
		try {
			abc.tosvg(abc_fname[0], elt_ref.source.value)
		} catch(e) {
			alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack);
			playing = false;
			a_pe = null
			return
		}
		a_pe = abcplay.clear()	// keep the playing events
	}
	document.getElementById("playbutton").innerHTML = texts.stop;

	if (colcl.length <= 1)
		pe = a_pe
	else
		build_pe();
	colcl_sav = colcl;
	colorsel(false);
	abcplay.play(0, 1000000, pe)
}

// set the version and initialize the playing engine
function edit_init() {

	// loop until abc2svg is loaded
	if (typeof abc2svg != "object"
	 || !abc2svg.version) {
		setTimeout(edit_init, 500)
		return
	}

	function set_pref() {
	    var	v = storage(true, "fontsz")
		if (v) {
			elt_ref.source.style.fontSize =
				elt_ref.src1.style.fontSize =
					v + "px";
			document.getElementById("fontsize").value =
					Number(v)
		}
		v = storage(true, "lang")
		if (v)
			loadlang(v, true)
	}

	document.getElementById("abc2svg").innerHTML =
		'abc2svg-' + abc2svg.version + ' (' + abc2svg.vdate + ')'

	// keep references on the page elements
	var a = ["diverr", "source", "src1", "s0", "s1"]
	for (var i = 0; i < a.length; i++) {
		var e = a[i];
		elt_ref[e] = document.getElementById(e)
	}

	// set the callback functions
	e = document.getElementById("saveas");
	e.addEventListener("click", saveas);
	e = elt_ref.s0;
	e.addEventListener("click", function(){selsrc(0)});
	e = elt_ref.s1;
	e.addEventListener("click", function(){selsrc(1)})

	// remove the selection on print
	window.addEventListener("beforeprint", function() {
		colcl_sav = colcl;
		colorsel(false)
	});
	window.addEventListener("afterprint", function() {
		colcl = colcl_sav;
		colorsel(true)
	})

	// if playing is possible, load the playing script
	if (window.AudioContext || window.webkitAudioContext
	 || navigator.requestMIDIAccess) {
		loadjs("play-@MAJOR@.js", function() {
			abcplay = AbcPlay({
					onend: endplay,
					onnote:notehlight,
					});
			var e = document.getElementById("playbutton");
			e.addEventListener("click", play_tune);
			e.style.display = "inline-block";
			document.getElementById("playdiv1").style.display =
				document.getElementById("playdiv2").style.display =
				document.getElementById("playdiv3").style.display =
				document.getElementById("playdiv4").style.display =
					"list-item";

			document.getElementById("fol").checked = abcplay.set_follow();
			document.getElementById("sfu").value = abcplay.set_sfu();
//			document.getElementById("spv").innerHTML =
//				Math.log(abcplay.set_speed()) / Math.log(3);
			document.getElementById("gvol").setAttribute("value",
				abcplay.set_vol() * 10)
			document.getElementById("gvl").setAttribute("value",
				(abcplay.set_vol() * 10).toFixed(2))
		});
	}
	set_pref()	// set the preferences from local storage
}

// drag and drop
function drag_over(evt) {
	evt.stopImmediatePropagation();
	evt.preventDefault()	// allow drop
}
function dropped(evt) {
	evt.stopImmediatePropagation();
	evt.preventDefault()
	// check if text
	var data = evt.dataTransfer.getData("text")
	if (data) {
		evt.target.value = data;
		src_change()
		return
	}
	// check if file
	data = evt.dataTransfer.files	// FileList object.
	if (data.length != 0) {
		var reader = new FileReader();
		reader.onload = function(evt) {
			elt_ref.source.value = evt.target.result;
			src_change()
		}
		reader.readAsText(data[0],"UTF-8")
		return
	}
}

// render the music after 2 seconds on textarea change
var timer
function src_change() {
	clearTimeout(timer);
	if (!playing)
		timer = setTimeout(render, 2000)
}

// wait for scripts to be loaded
setTimeout(edit_init, 500)
