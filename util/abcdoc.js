//#javascript
// abcdoc-1.js file to include in html pages with abc2svg-1.js
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
	abc

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

// load a javascript file (needed for modules)
var jsdir = (function() {
    var scrs = document.getElementsByTagName('script');
	return scrs[scrs.length - 1].src.match(/.*\//) || ''
})()

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

// function called when the page is loaded
function dom_loaded() {
	var page = document.body.innerHTML

	// load the required modules
	if (!modules.load(page, null, dom_loaded))
		return

	// search the ABC tunes and add their rendering as SVG images
	var	i = 0, j, k, res,
		re = /\n%abc|\nX:/g,		// start on "%abc" or "X:"
		re_stop = /\n<|\n%.begin/g;	// stop on "<" and skip "%%begin"

	abc = new Abc(user);
	abc.tosvg('abcexample', '%%bgcolor white\n\
%%rightmargin 0.8cm\n\
%%leftmargin 0.8cm\n\
%%topspace 0')
	for (;;) {

		// get the start of a ABC sequence
		res = re.exec(page)
		if (!res)
			break
		j = re.lastIndex - res[0].length;
		new_page += page.slice(i, j);

		// get the end of the ABC sequence
		// including the %%beginxxx/%%endxxx sequences
		re_stop.lastIndex = j
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
		tune = page.slice(j + 1, k);
		new_page += '<pre style="display:inline-block; vertical-align: top">' +
				clean_txt(tune) +
				'</pre>\n\
<div style="display:inline-block; vertical-align: top">\n'
// not "float:right"
		try {
			abc.tosvg('abcdoc', tune)
		} catch (e) {
			alert("abc2svg javascript error: " + e.message +
				"\nStack:\n" + e.stack)
		}
		if (errtxt) {
			i = page.indexOf("\n", j + 1);
			i = page.indexOf("\n", i + 1);
			alert("Errors in\n" +
				page.slice(j + 1, i) +
				"\n...\n\n" + errtxt);
			errtxt = ""
		}
		new_page += '</div><br/>\n';
		i = k
		if (k >= page.length)
			break
		re.lastIndex = i
	}
//console.log('result:\n' + new_page)
	try {
		document.body.innerHTML = new_page + page.slice(i)
	} catch (e) {
		alert("abc2svg bad generated SVG: " + e.message +
			"\nStack:\n" + e.stack)
	}
}

// wait for the page to be loaded
document.addEventListener("DOMContentLoaded", dom_loaded, false)
