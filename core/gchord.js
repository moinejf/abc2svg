// abc2svg - gchord.js - chord symbols
//
// Copyright (C) 2014-2018 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// -- parse a chord symbol / annotation --
// the result is added in the global variable a_gch
// 'type' may be a single '"' or a string '"xxx"' created by U:
function parse_gchord(type) {
	var	c, text, gch, x_abs, y_abs, type,
		i, istart, iend,
		ann_font = get_font("annotation"),
		h_ann = ann_font.size,
		line = parse.line

	function get_float() {
		var txt = ''

		while (1) {
			c = text[i++]
			if ("1234567890.-".indexOf(c) < 0)
				return parseFloat(txt)
			txt += c
		}
	} // get_float()

	istart = parse.bol + line.index
	if (type.length > 1) {			// U:
		text = type.slice(1, -1);
		iend = istart + 1
	} else {
		text = ""
		while (1) {
			c = line.next_char()
			if (!c) {
				syntax(1, "No end of guitar chord")
				return
			}
			if (c == '"')
				break
			if (c == '\\') {
				text += c;
				c = line.next_char()
			}
			text += c
		}
		iend = parse.bol + line.index + 1
	}

	if (curvoice.pos.gch == SL_HIDDEN)
		return

	i = 0;
	type = 'g'
	while (1) {
		c = text[i]
		if (!c)
			break
		gch = {
			text: "",
			istart: istart,
			iend: iend,
			font: ann_font
		}
		switch (c) {
		case '@':
			type = c;
			i++;
			x_abs = get_float()
			if (c != ',') {
				syntax(1, "',' lacking in annotation '@x,y'");
				y_abs = 0
			} else {
				y_abs = get_float()
				if (c != ' ')
					i--
			}
			gch.x = x_abs;
			gch.y = y_abs - h_ann / 2
			break
		case '^':
		case '_':
		case '<':
		case '>':
			i++;
			type = c
			break
		default:
			switch (type) {
			case 'g':
				gch.font = get_font("gchord")
				break
			case '@':
				gch.x = x_abs;
				y_abs -= h_ann;
				gch.y = y_abs - h_ann / 2
				break
			}
			break
		}
		gch.type = type
		while (1) {
			c = text[i]
			if (!c)
				break
			switch (c) {
			case '\\':
				c = text[++i]
				if (!c || c == 'n')
					break
				gch.text += '\\'
			default:
				gch.text += c;
				i++
				continue
			case '&':			/* skip "&xxx;" */
				while (1) {
					gch.text += c;
					c = text[++i]
					switch (c) {
					default:
						continue
					case ';':
					case undefined:
					case '\\':
						break
					}
					break
				}
				if (c == ';') {
					gch.text += c
					continue
				}
				break
			case ';':
				break
			}
			i++
			break
		}
		if (!a_gch)
			a_gch = []
		a_gch.push(gch)
	}
}

// transpose a chord symbol
var	note_names = "CDEFGAB",
	latin_names = [ "Do", "Re", "Mi", "Fa", "Sol", "La", "Si" ],
	acc_name = ["bb", "b", "", "#", "##"]

	function gch_tr1(p, i2) {
		var	new_txt, l,
			n, i1, i3, i4, ix, a, ip, ip2,
			latin = 0

		/* main chord */
		switch (p[0]) {
		case 'A': n = 5; break
		case 'B': n = 6; break
		case 'C': n = 0; break
		case 'D':
			if (p[1] == 'o') {
				latin++;
				n = 0		/* Do */
				break
			}
			n = 1
			break
		case 'E': n = 2; break
		case 'F':
			if (p[1] == 'a')
				latin++;	/* Fa */
			n = 3
			break
		case 'G': n = 4; break
		case 'L':
			latin++;		/* La */
			n = 5
			break
		case 'M':
			latin++;		/* Mi */
			n = 2
			break
		case 'R':
			latin++
			n = 1			/* Re */
			break
		case 'S':
			latin++
			if (p[1] == 'o') {
				latin++;
				n = 4		/* Sol */
			} else {
				n = 6		/* Si */
			}
			break
		case '/':			// bass only
			latin--
			break
		default:
			return p
		}

		a = 0;
		ip = latin + 1
		if (latin >= 0) {		// if some chord
			while (p[ip] == '#') {
				a++;
				ip++
			}
			while (p[ip] == 'b') {
				a--;
				ip++
			}
//			if (p[ip] == '=')
//				ip++
			i3 = cde2fcg[n] + i2 + a * 7;
			i4 = cgd2cde[(i3 + 16 * 7) % 7];	// note
			i1 = ((((i3 + 22) / 7) | 0) + 159) % 5;	// accidental
			new_txt = (latin ? latin_names[i4] : note_names[i4]) +
					acc_name[i1]
		} else {
			new_txt = ''
		}

		ip2 = p.indexOf('/', ip)	// skip 'm'/'dim'..
		if (ip2 < 0)
			return new_txt + p.slice(ip);

		/* bass */
		n = note_names.indexOf(p[++ip2])
		if (n < 0)
			return new_txt + p.slice(ip);
//fixme: latin names not treated
		new_txt += p.slice(ip, ip2);
		a = 0
		if (p[++ip2] == '#') {
			a++
			if (p[++ip2] == '#') {
				a++;
				ip2++
			}
		} else if (p[ip2] == 'b') {
			a--
			if (p[++ip2] == 'b') {
				a--;
				ip2++
			}
		}
		i3 = cde2fcg[n] + i2 + a * 7;
		i4 = cgd2cde[(i3 + 16 * 7) % 7];	// note
		i1 = ((((i3 + 22) / 7) | 0) + 159) % 5;	// accidental
		return new_txt + note_names[i4] + acc_name[i1] + p.slice(ip2)
	} // get_tr1

function gch_transp(s) {
	var	gch, p, j,
		i = 0,
		i2 = curvoice.ckey.k_sf - curvoice.okey.k_sf

	while (1) {
		gch = s.a_gch[i++]
		if (!gch)
			return
		if (gch.type != 'g')
			continue
		p = gch.text;
		j = p.indexOf('\t')
		if (j >= 0) {
			j++;
			p = p.slice(0, j) + gch_tr1(p.slice(j), i2)
		}
		gch.text = gch_tr1(p, i2)
	}
}

// -- build the chord indications / annotations --
function gch_build(s) {

	/* split the chord indications / annotations
	 * and initialize their vertical offsets */
	var	gch, wh, xspc, ix,
		pos = curvoice.pos.gch == SL_BELOW ? -1 : 1,
		y_above = 0,
		y_below = 0,
		y_left = 0,
		y_right = 0,
		box = cfmt.gchordbox,
		GCHPRE = .4;		// portion of chord before note

	s.a_gch = a_gch;
	a_gch = null

	if (curvoice.vtransp)
		gch_transp(s)

	// change the accidentals in the chord symbols,
	// convert the escape sequences in annotations, and
	// set the offsets
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type == 'g') {
			if (cfmt.chordnames) {
				gch.otext = gch.text;	// save for %%diagram
				gch.text = gch.text.replace(/A|B|C|D|E|F|G/g,
					function(c){return cfmt.chordnames[c]})
				if (cfmt.chordnames.B == 'H')
					gch.text = gch.text.replace(/Hb/g, 'Bb')
			}
			gch.text = gch.text.replace(/##|#|=|bb|b/g,
				function(x) {
					switch (x) {
					case '##': return "&#x1d12a;"
					case '#': return "\u266f"
					case '=': return "\u266e"
					case 'b': return "\u266d"
					}
					return "&#x1d12b;"
				});
		} else {
			gch.text = cnv_escape(gch.text);
			if (gch.type == '@'
			 && !user.anno_start && !user.anno_stop)
				continue		/* no width */
		}

		/* set the offsets and widths */
		gene.curfont = gch.font;
		wh = strwh(gch.text);
		gch.w = wh[0]
		switch (gch.type) {
		case '@':
			break
		case '^':			/* above */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_above -= wh[1];
			gch.y = y_above
			break
		case '_':			/* below */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_below -= wh[1];
			gch.y = y_below
			break
		case '<':			/* left */
			gch.x = -(wh[0] + 6);
			y_left -= wh[1];
			gch.y = y_left + wh[1] / 2
			break
		case '>':			/* right */
			gch.x = 6;
			y_right -= wh[1];
			gch.y = y_right + wh[1] / 2
			break
		default:			// chord symbol
			gch.box = box
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			if (pos < 0) {		/* below */
				y_below -= wh[1];
				gch.y = y_below
				if (box) {
					y_below -= 2;
					gch.y -= 1
				}
			} else {
				y_above -= wh[1];
				gch.y = y_above
				if (box) {
					y_above -= 2;
					gch.y -= 1
				}
			}
			break
		}
	}

	/* move upwards the top and middle texts */
	y_left /= 2;
	y_right /= 2
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		switch (gch.type) {
		case '^':			/* above */
			gch.y -= y_above
			break
		case '<':			/* left */
			gch.y -= y_left
			break
		case '>':			/* right */
			gch.y -= y_right
			break
		case 'g':			// chord symbol
			if (pos > 0)
				gch.y -= y_above
			break
		}
	}
}

// -- draw the chord symbols and annotations
// (the staves are not yet defined)
// (unscaled delayed output)
function draw_gchord(s, gchy_min, gchy_max) {
	var	gch, gch2, text, ix, x, y, y2, i, j, hbox, h

	// adjust the vertical offset according to the chord symbols
//fixme: w may be too small
	var	w = s.a_gch[0].w,
		y_above = y_get(s.st, 1, s.x - 2, w),
		y_below = y_get(s.st, 0, s.x - 2, w),
		yav = (((s.notes[s.nhd].pit + s.notes[0].pit) >> 1) - 18) * 3

	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type != 'g')
			continue
		gch2 = gch		// chord symbol closest to the staff
		if (gch.y < 0)
			break
	}
	if (gch2) {
		if (gch2.y >= 0) {
			if (y_above < gchy_max)
				y_above = gchy_max
		} else {
			if (y_below > gchy_min)
				y_below = gchy_min
		}
	}

	set_dscale(s.st);
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix];
		use_font(gch.font);
		set_font(gch.font);
		h = gch.font.size;
		w = gch.w;
		x = s.x + gch.x;
		text = gch.text
		switch (gch.type) {
		case '_':			/* below */
			y = gch.y + y_below;
			y_set(s.st, 0, x, w, y - h * .2 - 2)
			break
		case '^':			/* above */
			y = gch.y + y_above;
			y_set(s.st, 1, x, w, y + h * .8 + 2)
			break
		case '<':			/* left */
/*fixme: what symbol space?*/
			if (s.notes[0].acc)
				x -= s.notes[0].shac;
			y = gch.y + yav - h / 2
			break
		case '>':			/* right */
			x += s.xmx
			if (s.dots > 0)
				x += 1.5 + 3.5 * s.dots;
			y = gch.y + yav - h / 2
			break
		default:			// chord symbol
			hbox = gch.box ? 3 : 2
			if (gch.y >= 0) {
				y = gch.y + y_above;
				y_set(s.st, true, x, w, y + h + hbox)
			} else {
				y = gch.y + y_below;
				y_set(s.st, false, x, w, y - hbox)
			}
			i = text.indexOf('\t')

			// if some TAB: expand the chord symbol
			if (i >= 0) {
				x = realwidth
				for (var next = s.next; next; next = next.next) {
					switch (next.type) {
					default:
						continue
					case NOTE:
					case REST:
					case BAR:
						x = next.x
						break
					}
					break
				}
				j = 2
				for (;;) {
					i = text.indexOf('\t', i + 1)
					if (i < 0)
						break
					j++
				}
				var expdx = (x - s.x) / j;

				x = s.x;
				y *= staff_tb[s.st].staffscale
				if (user.anno_start)
					user.anno_start("gchord", gch.istart, gch.iend,
						x - 2, y + h + 2, w + 4, h + 4, s)
				i = 0;
				j = i;
				for (;;) {
					i = text.indexOf('\t', j)
					if (i < 0)
						break
					xy_str(x, y, text.slice(j, i), 'c');
					x += expdx;
					j = i + 1
				}
				xy_str(x, y, text.slice(j), 'c')
				if (user.anno_stop)
					user.anno_stop("gchord", gch.istart, gch.iend,
						s.x - 2, y + h + 2, w + 4, h + 4, s)
				continue
			}
			break
		case '@':			/* absolute */
			y = gch.y + yav
			if (y > 0) {
				y2 = y + h
				if (y2 > staff_tb[s.st].ann_top)
					staff_tb[s.st].ann_top = y2
			} else {
				if (y < staff_tb[s.st].ann_bot)
					staff_tb[s.st].ann_bot = y
			}
			break
		}
		if (user.anno_start)
			user.anno_start("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
		if (gch.box)
			xy_str_b(x, y, text)
		else
			xy_str(x, y, text)
		if (user.anno_stop)
			user.anno_stop("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
	}
}
