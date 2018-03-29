//#javascript
// abcemb-1.js file to include in html pages with abc2svg-1.js
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

var	errtxt = '',
	new_page = '',
	abc,
	play,				// undefined: no play possible,
					// 1: play possible,
					// 2: playing
	abcplay,
	playconf = {
		onend: endplay
//uncomment for test
//		,sfu: "./"
	},
	page,				// document source
	a_src = [],			// index: #sequence,
					//	value: [start_idx, end_idx]
	a_pe = [],			// index: #sequence, value: playing events
	glop,				// global sequence for play
	old_gm

// -- abc2svg init argument
var user = {
	errmsg: function(msg, l, c) {	// get the errors
		errtxt += clean_txt(msg) + '\n'
	},
	img_out: function(str) {	// image output
		new_page += str
	},
	page_format: true		// define the non-page-breakable blocks
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

function endplay() {
	play = 1
}

// function called on rendering click
function playseq(seq) {
	if (typeof AbcPlay == "undefined")
		return			// play-1.js not loaded
	if (play == 2) {
		abcplay.stop();
		return
	}
	play = 2
	if (!a_pe[seq]) {		// if no playing event
		if (!abcplay)
			abcplay = AbcPlay(playconf)
		var abc = new Abc(user);

		abcplay.clear();
		abc.tosvg("play", "%%play")
		try {
			if (glop)
				abc.tosvg("abcemb", page, glop[0], glop[1]);
			abc.tosvg("abcemb" + seq, page, a_src[seq][0], a_src[seq][1])
		} catch(e) {
			alert(e.message + '\nabc2svg tosvg bug - stack:\n' + e.stack);
			play = 1;
			a_pe[seq] = null
			return
		}
		a_pe[seq] = abcplay.clear()	// keep the playing events
	}
	abcplay.play(0, 100000, a_pe[seq])
}

// load a javascript file
var jsdir = (function() {
    var scrs = document.getElementsByTagName('script');
	return scrs[scrs.length - 1].src.match(/.*\//) || ''
})()

function loadjs(fn, relay) {
	var s = document.createElement('script');
	s.src = jsdir + fn;
	s.type = 'text/javascript'
	if (relay)
		s.onload = relay;
	document.head.appendChild(s)
}

// function called when the page is loaded
function dom_loaded() {
	if (typeof Abc != "function") {		// wait for the abc2svg core
		setTimeout(dom_loaded, 500)
		return
	}
	page = document.body.innerHTML;

	// load the required modules
	if (!modules.load(page, null, dom_loaded))
		return

	// search the ABC tunes,
	// replace them by SVG images with play on click
	var	i = 0, j, k, res, src,
		seq = 0,
		re = /\n%abc|\nX:/g,
		re_stop = /\nX:|\n<|\n%.begin/g;
	abc = new Abc(user)
	for (;;) {

		// get the start of a ABC sequence
		res = re.exec(page)
		if (!res)
			break
		j = re.lastIndex - res[0].length;
		new_page += page.slice(i, j);

		// get the end of the ABC sequence
		// including the %%beginxxx/%%endxxx sequences
		re_stop.lastIndex = ++j
		while (1) {
			res = re_stop.exec(page)
			if (!res || res[0][1] != "%")
				break
			k = page.indexOf(res[0].replace("begin", "end"),
					re_stop.lastIndex)
			if (k < 0)
				break
			re_stop.lastIndex = k
		}
		if (!res || k < 0)
			k = page.length
		else
			k = re_stop.lastIndex - 2;
		if (play) {
			if (page[j] == 'X') {
				new_page += '<div onclick="playseq(' +
						a_src.length +
						')">\n';
				a_src.push([j, k])
			} else if (!glop) {
				glop = [j, k]
			}
		}
		try {
			abc.tosvg('abcemb', page, j, k)
		} catch (e) {
			alert("abc2svg javascript error: " + e.message +
				"\nStack:\n" + e.stack)
		}
		if (errtxt) {
			i = page.indexOf("\n", j);
			i = page.indexOf("\n", i + 1);
			alert("Errors in\n" +
				page.slice(j, i) +
				"\n...\n\n" + errtxt);
			errtxt = ""
		}
		if (play && page[j] == 'X')
			new_page += '</div>\n';
		i = k
		if (i >= page.length)
			break
		if (page[i] == 'X')
			i--
		re.lastIndex = i
	}
	try {
		document.body.innerHTML = new_page + page.slice(i)
	} catch (e) {
		alert("abc2svg bad generated SVG: " + e.message +
			"\nStack:\n" + e.stack)
	}
	if (play) {
		delete user.img_out;		// stop SVG generation
		old_gm = user.get_abcmodel;
		user.get_abcmodel = function(tsfirst, voice_tb, music_types, info) {
				if (old_gm)
					old_gm(tsfirst, voice_tb, music_types, info);
				abcplay.add(tsfirst, voice_tb)
			}
	}
} // dom_loaded()

// if playing is possible, load the playing scripts
if (window.AudioContext || window.webkitAudioContext)
	play = 1			// play possible

// wait for the page to be loaded
document.addEventListener("DOMContentLoaded", dom_loaded, false)
