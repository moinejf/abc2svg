//#javascript
// abcemb-1.js file to include in html pages with abc2svg-1.js
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

var	errtxt = '',
	new_page = '',
	abc,
	play,				// undefined: no play possible,
					// 1: play possible,
					// 2: playing
	abcplay,
	a_src = [],			// index: #sequence, value: ABC source
	a_pe = []			// index: #sequence, value: playing events

// -- abc2svg init argument
var user = {
	errmsg: function(msg, l, c) {	// get the errors
		errtxt += msg + '\n'
	},
	img_out: function(str) {	// image output
		new_page += str
	},
	page_format: true		// define the non-page-breakable blocks
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
		endplay()
		return
	}
	play = 2
	if (!a_pe[seq]) {		// if no playing event
		if (!abcplay)
			abcplay = new AbcPlay(endplay,
//fixme: switch comment for test
			"https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/")
//				"./")
		var abc = new Abc(user);

		abcplay.clear();
		abc.tosvg("play", "%%play")
		try {
			abc.tosvg("abcemb" + seq, a_src[seq])
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

// function called when the page is loaded
function dom_loaded() {
	var page = document.body.innerHTML;

	user.get_abcmodel =
		function(tsfirst, voice_tb, music_types, info) {
			if (play == 2)
				abcplay.add(tsfirst, voice_tb)
		}

	// search the ABC tunes,
	// replace them by SVG images and
	// generate the sounds
	var	i = 0, j, k, res, src,
		seq = 0,
		re = /\n%abc|\nX:/g,
		re_stop = /\n<|\n%.begin/g;
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
			if (!res || res[0] == "\n<")
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
		src = page.slice(j, k)
		if (play) {
			new_page += '<div onclick="playseq(' +
					a_src.length +
					')">\n';
			a_src.push(src)
		}
		try {
			abc.tosvg('abcemb', src)
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
		if (play)
			new_page += '</div>\n';
		i = k
		if (k >= page.length)
			break
		re.lastIndex = i
	}
	user.img_out = null		// stop SVG generation
	try {
		document.body.innerHTML = new_page + page.slice(i)
	} catch (e) {
		alert("abc2svg bad generated SVG: " + e.message +
			"\nStack:\n" + e.stack)
	}
}

// if playing is possible, load the playing scripts
if (window.AudioContext || window.webkitAudioContext)
	play = 1			// play possible

// wait for the page to be loaded
document.addEventListener("DOMContentLoaded", dom_loaded, false)
