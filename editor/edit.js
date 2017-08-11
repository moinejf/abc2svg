// edit.js - file used in the abc2svg editor
//
// Copyright (C) 2014-2017 Jean-Francois Moine
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

var	abc_images,			// image buffer
	abc_fname = ["noname.abc", ""],	// file names
	abc,				// Abc object
	ref,				// source reference array
	colcl = [],			// colorized classes
	abcplay,			// play engine
	a_pe,				// playing events
	playing,
	selrec = {},
	texts = {			// language specific texts
		bad_nb: 'Bad line number',
		fn: 'File name: ',
		load: 'Please, load the included file ',
		play: 'Play',
		stop: 'Stop'
	}

// -- Abc create argument
var ignore_types = {
	beam: true,
	slur: true,
	tuplet: true
}
var user = {
	// -- required methods
	// include a file (%%abc-include - only one)
	read_file: function(fn) {
		document.getElementById("s" + srcidx).style.display = "inline"
		return document.getElementById("src1").value
	},
	// insert the errors
	errmsg: function(msg, l, c) {
		var diverr = document.getElementById("diverr");
		msg = clean_txt(msg)
		if (l)
			diverr.innerHTML += '<b onclick="gotoabc(' +
				l + ',' + c +
				')" style="cursor: pointer; display: inline-block">' +
				msg + "</b><br/>\n"
		else
			diverr.innerHTML += msg + "<br/>\n"
	},
	// image output
	my_img_out: function(str) {
		abc_images += str
	},
	// -- optional methods
	// annotations
	anno_stop: function(type, start, stop, x, y, w, h) {
		if (ignore_types[type])
			return
		ref[start] = stop;		// keep the source reference

		// create a rectangle
		abc.out_svg('<rect class="abcr _' + start +
			'_" x="');
		abc.out_sxsy(x, '" y="', y);
		abc.out_svg('" width="' + w.toFixed(2) +
			'" height="' + h.toFixed(2) + '"/>\n')
	},
	// -- optional attributes
	page_format: true		// define the non-page-breakable blocks
    },
    srcidx = 0

// -- local functions

// replace <>& by XML character references
function clean_txt(txt) {
	return txt.replace(/<|>|&.*?;|&/g, function(c) {
		switch (c) {
		case '<': return "&lt;"
		case '>': return "&gt;"
		}
		if (c == '&')
			return "&amp;"
		return c
	})
}

// load the language files ('edit-lang.js' and 'err-lang.js')
function relay() { loadtxt() }
function loadlang(lang) {
	function loadjs(fn, with_relay) {
		var s = document.createElement('script');
		s.src = fn;
		s.type = 'text/javascript'
		if (with_relay) {
			s.onload = relay;
			s.onreadystatechange = relay
		}
		document.head.appendChild(s)
	}
	loadjs('edit-' + lang + '.js', true);
	loadjs('err-' + lang + '.js')
}

// show/hide a popup message
function popshow(area, visible) {
	document.getElementById(area).style.visibility =
		visible ? 'visible' : 'hidden'
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
		document.getElementById(s).value = content;
		document.getElementById("s" + srcidx).value = abc_fname[srcidx];
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
	document.getElementById(o).style.display = "none";
	document.getElementById(n).style.display = "inline";
	document.getElementById("s" + srcidx).style.backgroundColor = "#ffd0d0";
	document.getElementById("s" + idx).style.backgroundColor = "#80ff80";
	srcidx = idx
}

// render the textarea content to the right side
function render() {
	var	i, j,
		target = document.getElementById("target"),
		diverr = document.getElementById("diverr"),
		content = document.getElementById("source").value
	a_pe = null
	if (!content)
		return			// empty source

	// if include file not loaded yet, ask it
	i = content.indexOf('%%abc-include ')
	if (i >= 0) {
		var sl = document.getElementById("s1")
		if (!sl.value) {
			sl.style.display = "inline";
			j = content.indexOf('\n', i);
			sl.value = content.slice(i + 14, j);
			selsrc(1);
			alert(texts.load + sl.value)
			return
		}
	}
	user.img_out = user.my_img_out;
	abc = new Abc(user);
	abc_images = '';
	abc.tosvg('edit', '%%bgcolor white');

	diverr.innerHTML = '';
//	document.body.style.cursor = "wait";
	ref = []
	try {
		abc.tosvg(abc_fname[0], content)
	} catch(e) {
		alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack)
		return
	}
//	document.body.style.cursor = "default";

	try {
		target.innerHTML = abc_images
	} catch(e) {
		alert(e.message + '\nabc2svg image bug - abort')
		return
	}

	// show the 'Error' button if some error
	document.getElementById("er").style.display =
				diverr.innerHTML ? 'inline' : 'none';

	// set the callbacks in the SVG images
	setTimeout(function(){
		var	elts = target.getElementsByClassName('abcr'),
			i = elts.length,
			elt
		while (--i >= 0) {
			elt = elts[i];
			elt.onmouseover = function() {m_over(this)}
		}
		elts = target.getElementsByTagName("svg");
		i = elts.length
		while (--i >= 0) {
			elt = elts[i];
			elt.onmousedown = function(e) {svgsel(e, this)}
		}
	}, 300)
}

// select a source ABC element
function gotoabc(l, c) {
	var	s = document.getElementById("source"),
		idx = 0
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
	colorsel(false)
	var cl = elt.getAttribute('class');
	colcl = [cl.split(' ')[1]];	// cl[0]:'abcr', cl[1]:elt ref
	colorsel(true)
}

// select elements in an image
function svgsel(evt, svg) {
var	pt, nr, i, elts, elt, x, y, cl,
	xmlns = "http://www.w3.org/2000/svg"
	switch (evt.type) {
	case "mousedown":
		if (selrec.rect) {
			svg.removeChild(selrec.rect);
			selrec.rect = null
		}
		colorsel(false);
		svg.onmousemove = function(e) {svgsel(e, this)};
		svg.onmouseup = function(e) {svgsel(e, this)};
		pt = svg.getBoundingClientRect();
		selrec.xs = evt.clientX - pt.left;
		selrec.ys = evt.clientY - pt.top;
		selrec.sel = true;
		evt.stopPropagation()
		break
	case "mousemove":
		if (!selrec.sel)
			break
		pt = svg.getBoundingClientRect();
		selrec.x = evt.clientX - pt.left;
		selrec.y = evt.clientY - pt.top
		if (!selrec.rect) {
			nr = true;
			selrec.rect = document.createElementNS(xmlns, 'rect');
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
		evt.stopPropagation()
		break
	case "mouseup":
//	case "mouseout":
		if (!selrec.sel)
			break
		selrec.sel = false;
		svg.onmousemove = null;
		svg.onmouseup = null
		if (!selrec.rect)
			break
		svg.removeChild(selrec.rect);

		// define the selection
		colorsel(false);
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
		evt.stopPropagation()
		break
	}
}

// colorize the selection
function colorsel(on) {
var	i, j, elts, d,
	i1 = 1000000,	// (hope a ABC file is smaller than that!)
	i2 = 0,
	n = colcl.length

	for (i = 0; i < n; i++) {
		elts = document.getElementsByClassName(colcl[i]);
		j = elts.length
		while (--j >= 0)
			elts[j].style.setProperty("fill-opacity", on ? 0.4 : 0)
		if (on) {
			d = colcl[i].split('_')
			if (d[1] < i1)
				i1 = d[1]
			if (ref[d[1]] > i2)
				i2 = ref[d[1]]
		}
	}
	if (i1 < i2) {
		var s = document.getElementById("source");
		s.focus();
		s.setSelectionRange(i1, i2)
	}
	if (!on)
		colcl = []
}

// source text selection callback
function seltxt(elt) {
	var	start, end, s, z, elts
	if (colcl.length != 0) {
		colorsel(false);
		colcl = []
	}
	if (elt.selectionStart == undefined)
		return
	start = elt.selectionStart;
	end = elt.selectionEnd
	if (start == 0
	 && end == document.getElementById("source").value.length)
		return				// select all
	ref.forEach(function(e, o) {
		if (o >= start && e <= end)
			colcl.push('_' + o + '_')
	})
	if (colcl.length != 0) {
		colorsel(true);
		s = document.getElementById("dright");
	  z = window.document.defaultView.getComputedStyle(s).getPropertyValue('z-index')
		if (z != 10) {			// if select from textarea
			elts = document.getElementsByClassName(colcl[0]);
			elts[0].scrollIntoView()	// move the element on the screen
		}
	}
}

// open a new window for file save
function saveas() {      
	var	s = srcidx == 0 ? "source" : "src1",
		source = document.getElementById(s).value,
		uriContent = "data:text/plain;charset=utf-8," +
				encodeURIComponent(source),

	// create a link for our script to 'click'
		link = document.createElement("a");

	document.getElementById("s" + srcidx).value =
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
	var	i = document.getElementById("fontsize");
	document.getElementById("source").style.fontSize = i.value.toString() + "px";
	document.getElementById("src1").style.fontSize = i.value.toString() + "px"
}

// playing
//fixme: do tune/start-stop selection of what to play
function notehlight(i, on) {
	var elts = document.getElementsByClassName('_' + i + '_');
	if (elts)
		elts[0].style.setProperty("fill-opacity", on ? 0.4 : 0)
}
function endplay() {
	document.getElementById("playbutton").innerHTML = texts.play;
	playing = false
}
function play_tune() {
	if (playing) {
		abcplay.stop();
		endplay()
		return
	}
	playing = true;
	if (!a_pe) {			// if no playing event
		user.img_out = null	// get the schema and stop SVG generation

		var abc = new Abc(user);

		abcplay.clear();
		abc.tosvg("play", "%%play")
		try {
			abc.tosvg(abc_fname[0], document.getElementById("source").value)
		} catch(e) {
			alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack);
			playing = false;
			a_pe = null
			return
		}
		a_pe = abcplay.clear()	// keep the playing events
	}
	document.getElementById("playbutton").innerHTML = texts.stop;
	abcplay.play(0, 1000000, a_pe)	// play all events
}

// set the version and initialize the playing engine
function edit_init() {

	// loop until abc2svg is loaded
	if (typeof abc2svg != "object"
	 || !abc2svg.version) {
		setTimeout(edit_init, 500)
		return
	}
	document.getElementById("abc2svg").innerHTML =
		'abc2svg-' + abc2svg.version + ' (' + abc2svg.vdate + ')'

	// set the callback functions
	var e = document.getElementById("saveas");
	e.addEventListener("click", saveas);
	e = document.getElementById("s0");
	e.addEventListener("click", function(){selsrc(0)});
	e = document.getElementById("s1");
	e.addEventListener("click", function(){selsrc(1)})

	// if playing is possible, load the playing scripts
	// and set the sound font according to the browser capability
	if (window.AudioContext || window.webkitAudioContext) {
		var script = document.createElement('script');
		script.src = "play-@MAJOR@.js";
		script.onload = function() {
			var	e,
				t = null,
				test = document.createElement('audio')
			if (test.canPlayType
			 && test.canPlayType('audio/mp3') != '')
				t = {type: "mp3"};
			abcplay = new AbcPlay(endplay, t, notehlight)
//fixme: get soundfont URL/type from cookies (?)
			e = document.getElementById("playbutton");
			e.addEventListener("click", play_tune);
			e.style.display = "inline-block";
			document.getElementById("playdiv1").style.display =
				document.getElementById("playdiv2").style.display =
				document.getElementById("playdiv3").style.display =
					"list-item";
			document.getElementById("sfu").setAttribute("value",
				abcplay.get_sfu());
//!! soundfont type is either 0:"js" or 1:"mp3" - see edit.xhtml
			document.getElementById("sft").selectedIndex =
				abcplay.get_sft() == "js" ? 0 : 1;
			document.getElementById("gvol").setAttribute("value",
				(abcplay.get_vol() * 10) | 0)
		}
		document.head.appendChild(script);

		user.get_abcmodel =
			function(tsfirst, voice_tb, music_types, info) {
				if (playing)
					abcplay.add(tsfirst, voice_tb)
			}
	}
}

// drag and drop
function drag_over(evt) {
	evt.stopPropagation();
	evt.preventDefault()	// allow drop
}
function dropped(evt) {
	evt.stopPropagation();
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
			document.getElementById('source').value =
					evt.target.result;
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
