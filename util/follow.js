// follow-1.js - file to include in html pages after
//	abc2svg-1.js, abcemb-1.js and play-1.js.
//	This script permits to follow the notes while playing.
//
// Copyright (C) 2015-2017 Jean-Francois Moine
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

var	ref = [],
	ignore_types = {
		beam:true,
		slur:true,
		tuplet:true
	}

user.anno_stop = function(type, start, stop, x, y, w, h) {
	if (ignore_types[type])
		return
	ref[start] = stop;		// keep the source reference

	// create a rectangle
	abc.out_svg('<rect class="abcr _' + start + '_" x="');
	abc.out_sxsy(x, '" y="', y);
	abc.out_svg('" width="' + w.toFixed(2) +
		'" height="' + h.toFixed(2) + '"/>\n')
}

function notehlight(i, on) {
	var elts = document.getElementsByClassName('_' + i + '_')
	if (elts && elts[0])
		elts[0].style["fill-opacity"] = on ? 0.4 : 0
}

// init
	abcplay = new AbcPlay({
				endplay: endplay,
				onnote: notehlight
			});
	abcplay.set_follow(1);

	// create the style of the rectangles
	setTimeout(function() {
		var sty = document.createElement("style");
		sty.innerHTML = ".abcr {fill: #d00000; fill-opacity: 0; z-index: 15}";
		document.body.appendChild(sty)
	}, 1000)
