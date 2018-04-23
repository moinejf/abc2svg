// psvg.js - small PS to SVG convertor for abc2svg

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

function Psvg(abcobj_r) {
    var	svgbuf = '',

// SVG functions - adapted from abcm2ps svg.c
	abcobj = abcobj_r,
	wps = new Wps(this),
	g = 0,			// graphic state
	gchg,			// graphic change
	gcur = {		// current graphic context
		cx:0,
		cy:0,
		xoffs:0,
		yoffs:0,
		xscale: 1,
		yscale: 1,
		rotate: 0,
		sin: 0,
		cos: 1,
		linewidth: 0.7,
		dash: ''
	},
	gc_stack = [],		// graphic stack
	x_rot = 0,
	y_rot = 0,
	font_n = "",
	font_n_old = "",
	font_s = 0,
	path;

// function called from Abc
    Psvg.prototype.getorig = function() {
	setg(0);
	return [gcur.xoffs - gcur.xorig, gcur.yoffs - gcur.yorig]
    }

    function defg1() {
	gchg = false;
	setg(0);
	svgbuf += "<g"
	if (gcur.xscale != 1 || gcur.yscale != 1 || gcur.rotate) {
		svgbuf += ' transform="'
		if (gcur.xscale != 1 || gcur.yscale != 1) {
			if (gcur.xscale == gcur.yscale)
				svgbuf += "scale(" + gcur.xscale.toFixed(3) + ")"
			else
				svgbuf += "scale(" + gcur.xscale.toFixed(3) +
						"," + gcur.yscale.toFixed(3) + ")"
		}
		if (gcur.rotate) {
			if (gcur.xoffs || gcur.yoffs) {
				var	x, xtmp = gcur.xoffs,
					y = gcur.yoffs,
					_sin = gcur.sin,
					_cos = gcur.cos;
				x = xtmp * _cos - y * _sin;
				y = xtmp * _sin + y * _cos;
				svgbuf += " translate(" + x.toFixed(2) + "," +
						y.toFixed(2) + ")";
				x_rot = gcur.xoffs;
				y_rot = gcur.yoffs;
				gcur.xoffs = 0;
				gcur.yoffs = 0
			}
			svgbuf += " rotate(" + gcur.rotate.toFixed(2) + ")"
		}
		svgbuf += '"'
	}
	output_font(false)
	if (gcur.rgb)
		svgbuf += ' style="color:' + gcur.rgb + '"';
	svgbuf += ">\n";
	g = 1
    }

    function objdup(obj) {
	var	k, tmp = new obj.constructor()
	for (k in obj)
	    if (obj.hasOwnProperty(k))
		tmp[k] = obj[k]
	return tmp
    }

    function output_font(back) {
	var	name = gcur.font_n
	if (!name)
		return
	var	prop = "",
		i = name.indexOf("Italic"),
		j = 100,
		o = name.indexOf("Oblique"),
		b = name.indexOf("Bold"),
		flags = 0
	if (b > 0) {
		prop = ' font-weight="bold"';
		j = b;
		flags = 2
	}
	if (i > 0 || o > 0) {
		if (i > 0) {
			prop += ' font-style="italic"';
			if (i < j)
				j = i;
			flags |= 4
		}
		if (o > 0) {
			prop += ' font-style="oblique"';
			if (o < j)
				j = o;
			flags = 8
		}
	}
	if (j != 100) {
		if (name[j - 1] == '-')
			j--;
		name = name.slice(0, j)
	}

	if (back) {
		if (!(flags & 2)
		 && font_n_old.indexOf("Bold") >= 0)
			prop += ' font-weight="normal"';
		if (!(flags & 12)
		 && (font_n_old.indexOf("Italic") >= 0
		  || font_n_old.indexOf("Oblique") >= 0))
			prop += ' font-style="normal"'
	}
	svgbuf += ' font-family="' + name + '"' +
		prop + ' font-size="' + gcur.font_s + '"'
    }

    function path_def() {
	if (path)
		return
	setg(1);
	gcur.px = gcur.cx;
	gcur.py = gcur.cy;
	path = '<path d="m' + (gcur.xoffs + gcur.cx).toFixed(2) +
		' ' + (gcur.yoffs - gcur.cy).toFixed(2) + '\n'
    }

    function path_end() {
	svgbuf += path;
	path = ''
    }

    function setg(newg) {
	if (g == 2) {
		svgbuf += "</text>\n";
		g = 1
	}
	if (newg == 0) {
		if (g) {
			g = 0;
			svgbuf += "</g>\n"
			if (gcur.rotate) {
				gcur.xoffs = x_rot;
				gcur.yoffs = y_rot;
				x_rot = 0;
				y_rot = 0
			}
		}
	} else if (gchg) {
		defg1()
	}
    }

    function strw(s) {
	return s.length * gcur.font_s * 0.5	// fixme: approximate value
    }
    Psvg.prototype.strw = strw;

// graphic functions called from wps.js
    function arc(x, y, r, a1, a2, arcn) {
	var x1, y1, x2, y2
	if (a1 >= 360)
		a1 -= 360
	if (a2 >= 360)
		a2 -= 360;
	x1 = x + r * Math.cos(a1 * Math.PI / 180);
	y1 = y + r * Math.sin(a1 * Math.PI / 180)

	if (gcur.cx != undefined) {
		if (path) {
			if (x1 != gcur.cx || y1 != gcur.cy)
				path += 'l'
			else
				path += 'm';
			path += (x1 - gcur.cx).toFixed(2) + " " +
				(-(y1 - gcur.cy)).toFixed(2)
		} else {
			gcur.cx = x1;
			gcur.cy = y1;
			path_def()
		}
	} else {
		if (path)		// should not occur
			path = ''
		gcur.cx = x1;
		gcur.cy = y1;
		path_def()
	}

	if (a1 == a2) {			/* circle */
		a2 = 180 - a1;
		x2 = x + r * Math.cos(a2 * Math.PI / 180);
		y2 = y + r * Math.sin(a2 * Math.PI / 180);
		path += 'a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 ' +
			(arcn ? '1 ' : '0 ') +
			(x2 - x1).toFixed(2) + ' ' +
			(y1 - y2).toFixed(2) + ' ' +
			r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 ' +
			(arcn ? '1 ' : '0 ') +
			(x1 - x2).toFixed(2) + ' ' +
			(y2 - y1).toFixed(2) + '\n';
		gcur.cx = x1;
		gcur.cy = y1
	} else {
		x2 = x + r * Math.cos(a2 * Math.PI / 180);
		y2 = y + r * Math.sin(a2 * Math.PI / 180);
		path += 'a' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 ' +
			(arcn ? '1 ' : '0 ') +
			(x2 - x1).toFixed(2) + ' ' +
			(y1 - y2).toFixed(2) + '\n';
		gcur.cx = x2;
		gcur.cy = y2
	}
    }
    Psvg.prototype.arc = arc

    Psvg.prototype.arcn = function(x, y, r, a1, a2) {
	arc(x, y, r, a1, a2, true)
    }

    Psvg.prototype.closepath = function() {
	if (path && gcur.cx)
		rlineto(gcur.px - gcur.cx, gcur.py - gcur.cy)
    }

    Psvg.prototype.cx = function() {
	return gcur.cx
    }

    Psvg.prototype.cy = function() {
	return gcur.cy
    }

    Psvg.prototype.curveto = function(x1, y1, x2, y2, x, y) {
	path_def();
	path += "\tC" + 
		(gcur.xoffs + x1).toFixed(2) + " " + (gcur.yoffs - y1).toFixed(2) + " " +
		(gcur.xoffs + x2).toFixed(2) + " " + (gcur.yoffs - y2).toFixed(2) + " " +
		(gcur.xoffs + x).toFixed(2) + " " + (gcur.yoffs - y).toFixed(2) + "\n";
	gcur.cx = x;
	gcur.cy = y
    }

    Psvg.prototype.eofill = function() {
	path_end();
	svgbuf += '" fill-rule="evenodd" fill="currentColor"/>\n'
    }

    Psvg.prototype.fill = function() {
	path_end();
	svgbuf += '" fill="currentColor"/>\n'
    }

    Psvg.prototype.gsave = function() {
	gc_stack.push(objdup(gcur))
    }

    Psvg.prototype.grestore = function() {
	gcur = gc_stack.pop();
	gchg = true
    }

    Psvg.prototype.lineto = function(x, y) {
	path_def()
	if (x == gcur.cx)
		path += "\tv" + (gcur.cy - y).toFixed(2) + "\n"
	else if (y == gcur.cy)
		path += "\th" + (x - gcur.cx).toFixed(2) + "\n"
	else
		path += "\tl" + (x - gcur.cx).toFixed(2) + " " +
			(gcur.cy - y).toFixed(2) + "\n";
	gcur.cx = x;
	gcur.cy = y
    }

    Psvg.prototype.moveto = function(x, y) {
	gcur.cx = x;
	gcur.cy = y
	if (path) {
		path += "\tM" + (gcur.xoffs + gcur.cx).toFixed(2) + " " +
				(gcur.yoffs - gcur.cy).toFixed(2) + "\n"
	} else if (g == 2) {
		svgbuf += "</text>\n";
		g = 1
	}
    }

    Psvg.prototype.newpath = function() {
	gcur.cx = gcur.cy = undefined
    }

    Psvg.prototype.rcurveto = function(x1, y1, x2, y2, x, y) {
	path_def();
	path += "\tc" + 
		x1.toFixed(2) + " " + (-y1).toFixed(2) + " " +
		x2.toFixed(2) + " " + (-y2).toFixed(2) + " " +
		x.toFixed(2) + " " + (-y).toFixed(2) + "\n";
	gcur.cx += x;
	gcur.cy += y
    }

    function rlineto(x, y) {
	path_def()
	if (x == 0)
		path += "\tv" + (-y).toFixed(2) + "\n"
	else if (y == 0)
		path += "\th" + x.toFixed(2) + "\n"
	else
		path += "\tl" + x.toFixed(2) + " " +
			(-y).toFixed(2) + "\n";
	gcur.cx += x;
	gcur.cy += y
    }
    Psvg.prototype.rlineto = rlineto;

    Psvg.prototype.rmoveto = function(x, y) {
	if (path) {
		path += "\tm" + x.toFixed(2) + " " +
				(-y).toFixed(2) + "\n"
	} else if (g == 2) {
		svgbuf += "</text>\n";
		g = 1
	}
	gcur.cx += x;
	gcur.cy += y
    }

    Psvg.prototype.rotate = function(a) {
	setg(0)

	// convert orig and currentpoint coord to absolute coord
	var	x, xtmp = gcur.xoffs,
		y = gcur.yoffs,
		_sin = gcur.sin,
		_cos = gcur.cos;
	x = xtmp * _cos - y * _sin;
	y = xtmp * _sin + y * _cos;
	gcur.xoffs = x / gcur.xscale;
	gcur.yoffs = y / gcur.yscale;

	xtmp = gcur.cx;
	y = gcur.cy;
	x = xtmp * _cos - y * _sin;
	y = -xtmp * _sin + y * _cos;
	gcur.cx = x / gcur.xscale;
	gcur.cy = y / gcur.yscale;

	// rotate
	a = 360 - a;
	gcur.rotate += a
	if (gcur.rotate > 180)
		gcur.rotate -= 360
	else if (gcur.rotate <= -180)
		gcur.rotate += 360
	a = gcur.rotate * Math.PI / 180;
	gcur.sin = _sin = Math.sin(a);
	gcur.cos = _cos = Math.cos(a);
	x = gcur.cx;
	gcur.cx = (x * _cos + gcur.cy * _sin) * gcur.xscale;
	gcur.cy = (-x * _sin + gcur.cy * _cos) * gcur.yscale;
	x = gcur.xoffs;
	gcur.xoffs = (x * _cos + gcur.yoffs * _sin) *
			gcur.xscale;
	gcur.yoffs = (-x * _sin + gcur.yoffs * _cos) *
			gcur.yscale;
	gchg = true
    }

    Psvg.prototype.scale = function(sx, sy) {
	gcur.xoffs /= sx;
	gcur.yoffs /= sy;
	gcur.cx /= sx;
	gcur.cy /= sy;
	gcur.xscale *= sx;
	gcur.yscale *= sy;
	gchg = true
    }

    Psvg.prototype.selectfont = function(s, h) {
	s = s.nm;			// Symbol
	if (font_s != h || s != font_n) {
		gcur.font_n_old = gcur.font_n;
		gcur.font_n = s;
		gcur.font_s = h;
		gchg = true
	}
    }

    Psvg.prototype.setdash = function(a, o) {
	var n = a.length, i
	if (n == 0) {
		gcur.dash= ''
		return
	}
	gcur.dash = ' stroke-dashoffset="' + o + '"  stroke-dasharray="';
	i = 0
	while (1) {
		gcur.dash += a[i]
		if (--n == 0)
			break
		gcur.dash += ' '
	}
	gcur.dash += '"'
    }

    Psvg.prototype.setlinewidth = function(w) {
	gcur.linewidth = w
    }

    Psvg.prototype.setrgbcolor = function(r, g, b) {
	var rgb = 0x1000000 +
		(Math.floor(r * 255) << 16) +
		(Math.floor(g * 255) << 8) +
		Math.floor(b * 255);
	rgb = rgb.toString(16);
	rgb = rgb.replace('1', '#')
	if (rgb != gcur.rgb) {
		gcur.rgb = rgb;
		gchg = true
	}
    }

    Psvg.prototype.show = function(s) {
	var span, x, y
	if (gchg) {
		if (g == 2)
			span = true
		else
			defg1()
	}
	x = gcur.cx;
	y = gcur.cy
	if (span) {
		svgbuf += "<tspan\n\t";
		output_font(true);
		svgbuf += ">"
	} else if (g != 2) {
		svgbuf += '<text x="' + (x + gcur.xoffs).toFixed(2) + '" y="' +
				(gcur.yoffs - y).toFixed(2) + '">';
		g = 2
	}
	svgbuf += s.replace(/<|>|&|  /g, function(c){
			switch (c) {
			case '<': return "&lt;"
			case '>': return "&gt;"
			case '&': return "&amp;"
			case '  ': return '  '		// space + nbspace
			}
		})
	if (span)
		svgbuf += "</tspan>";
	gcur.cx = x + strw(s)
    }

    Psvg.prototype.stroke = function() {
	path_end()
	if (gcur.linewidth != 0.7)
		svgbuf += '" stroke-width="' + gcur.linewidth.toFixed(2);
	svgbuf += '" stroke="currentColor" fill="none"' + gcur.dash + '/>\n'
    }

    Psvg.prototype.translate = function(x, y) {
	gcur.xoffs += x;
	gcur.yoffs -= y;
	gcur.cx -= x;
	gcur.cy -= y
    }

// abcm2ps functions
    Psvg.prototype.arp = function(val, x, y) { abcobj.arpps(val, x, y) }
    Psvg.prototype.ltr = function(val, x, y) { abcobj.ltrps(val, x, y) }
    Psvg.prototype.xygl = function(x, y, gl) { abcobj.xyglps(x, y, gl) }
    Psvg.prototype.xygls = function(str, x, y, gl) { abcobj.xyglsps(str, x, y, gl) }
    Psvg.prototype.xyglv = function(val, x, y, gl) { abcobj.xyglvps(val, x, y, gl) }
    Psvg.prototype.y0 = function(y) { return abcobj.get_y(0, y) }
    Psvg.prototype.y1 = function(y) { return abcobj.get_y(1, y) }

// flush the PS buffer
function ps_flush(g0) {
	if (g0)
		setg(0);
	if (!svgbuf)
		return
	abcobj.out_svg(svgbuf);
	svgbuf = ''
}
Psvg.prototype.ps_flush = ps_flush

// evaluate a PS user sequence (%beginps .. %%endps)
Psvg.prototype.ps_eval = function(txt) {
	wps.parse(txt);
	ps_flush()
}

// ------ output builtin decorations
// common part
function pscall(f, x, y, script) {
	gcur.xorig = gcur.xoffs = abcobj.psget_x();
	gcur.yorig = gcur.yoffs = abcobj.psget_y();
	gcur.cx = 0;
	gcur.cy = 0;
	wps.parse(script +
		(x / abcobj.stv_g.scale).toFixed(2) + ' ' + y.toFixed(2) + ' ' + f);
	ps_flush(true)			// + setg(0)
	return true
}

// try to generate a decoration by PS
Psvg.prototype.psdeco = function(f, x, y, de) {
	var	dd, de2, script, defl,
		Os = wps.parse('/' + f + ' where'),
		A = Os.pop()

	if (!A)
		return false;
	defl = 0
	if (de.defl.nost)
		defl = 1
	if (de.defl.noen)
		defl |= 2
	if (de.s.stem >= 0)
		defl |= 4;

	Os.pop();
	script = '/defl ' + defl + ' def '
	if (de.lden) {
		script += x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
		de2 = de.start;
		x = de2.x;
		y = abcobj.get_y(de2.st, de2.y)
		if (x > de.x - 20)
			x = de.x - 20
	}
	dd = de.dd
	if (de.has_val) {
		script += de.val + ' '
	} else if (dd.str) {
		script += '(' + dd.str + ') ';
		y += dd.h * 0.2
	}
	return pscall(f, x, y, script)
}

// try to generate a glyph by PS
Psvg.prototype.psxygl = function(x, y, gl){
	var	Os = wps.parse('/' + gl + ' where'),
		A = Os.pop()
	if (!A)
		return false
	Os.pop()
	return pscall(gl, x, y, 'dlw ')
}

//  initialize the PostScript functions
	wps.parse("\
currentdict/systemdict currentdict put\n\
systemdict/{/mark cvx put\n\
systemdict/[/mark cvx put\n\
systemdict/]\n\
/counttomark cvx\n\
/array cvx\n\
/astore cvx\n\
/exch cvx\n\
/pop cvx\n\
5 array astore cvx put\n\
systemdict/}/] cvx/cvx cvx 2 array astore cvx put\n\
systemdict/def{currentdict 2 index 2 index put pop pop}put\n\
\n\
/maxlength 1000 def % TODO\n\
/.bdef{bind def}bind def\n\
/.xdef{exch def}.bdef\n\
/dup{0 index}.bdef\n\
/load{dup where pop exch get}.bdef\n\
/.ldef{load def}.bdef\n\
/if{{}ifelse}.bdef\n\
/cleartomark{array pop}.bdef\n\
/known{exch begin where{currentdict eq}{false}if end}.bdef\n\
/store{1 index where{3 1 roll put}{def}ifelse}.bdef\n\
/not{{false}{true}ifelse}.bdef\n\
%/.logand{{{true}{false}ifelse}{pop false}ifelse}.bdef\n\
%/and/.logand .ldef % TODO numeric and\n\
/.logor{{pop true}{{true}{false}ifelse}ifelse}.bdef\n\
/or/.logor .ldef % TODO numeric or\n\
/ne{eq not}.bdef\n\
/ge{lt not}.bdef\n\
/le{1 index 1 index eq 3 1 roll lt or}.bdef\n\
/gt{le not}.bdef\n\
/.repeat{1 1 4 2 roll for}.bdef\n\
\n\
%% math\n\
\n\
/floor{.math(floor)1 .call}.bdef\n\
\n\
/neg{0 exch sub}.bdef\n\
/add{neg sub}.bdef\n\
/idiv{div floor}.bdef\n\
\n\
/.pi{.math(PI)get}.bdef\n\
\n\
/abs{.math(abs)1 .call}.bdef\n\
%/.acos{.math(acos)1 .call}.bdef\n\
%/.asin{.math(asin)1 .call}.bdef\n\
/atan{.math(atan2)2 .call 180 mul .pi div}.bdef\n\
%/.atan2{.math(atan2)2 .call}.bdef\n\
%/ceiling{.math(ceil)1 .call}.bdef\n\
/cos{.pi mul 180 div .math(cos)1 .call}.bdef\n\
%/.exp{.math(exp)1 .call}.bdef\n\
%/log{.math(log)1 .call}.bdef\n\
%/.max{.math(max)2 .call}.bdef\n\
%/.min{.math(min)2 .call}.bdef\n\
%/.pow{.math(pow)2 .call}.bdef\n\
%/.random{.math(random)0 .call}.bdef\n\
%/rand{.random}.bdef % TODO follow spec\n\
%/round{.math(round)1 .call}.bdef\n\
%/sin{.math(sin)1 .call}.bdef\n\
%/sqrt{.math(sqrt)1 .call}.bdef\n\
%/.tan{.math(tan)1 .call}.bdef\n\
%/truncate{.math(truncate)1 .call}.bdef % TODO Math.truncate does not exist!\n\
\n\
% graphic\n\
/arc{.svg(arc)5 .call0}.bdef\n\
/arcn{.svg(arcn)5 .call0}.bdef\n\
/closepath{.svg(closepath)0 .call}.bdef\n\
/currentpoint{.svg(cx)0 .call .svg(cy)0 .call}.bdef\n\
/curveto{.svg(curveto)6 .call0}.bdef\n\
/eofill{.svg(eofill)0 .call0}.bdef\n\
/fill{.svg(fill)0 .call0}.bdef\n\
/grestore{.svg(grestore)0 .call0}.bdef\n\
/gsave{.svg(gsave)0 .call0}.bdef\n\
/lineto{.svg(lineto)2 .call0}.bdef\n\
/moveto{.svg(moveto)2 .call0}.bdef\n\
/newpath{.svg(newpath)0 .call0}.bdef\n\
/rcurveto{.svg(rcurveto)6 .call0}.bdef\n\
/rlineto{.svg(rlineto)2 .call0}.bdef\n\
/rmoveto{.svg(rmoveto)2 .call0}.bdef\n\
/rotate{.svg(rotate)1 .call0}.bdef\n\
/scale{.svg(scale)2 .call0}.bdef\n\
/selectfont{.svg(selectfont)2 .call0}.bdef\n\
/setdash{.svg(setdash)2 .call0}.bdef\n\
/setlinewidth{.svg(setlinewidth)1 .call0}.bdef\n\
/setrgbcolor{.svg(setrgbcolor)3 .call0}.bdef\n\
/show{.svg(show)1 .call0}.bdef\n\
/stroke{.svg(stroke)0 .call0}.bdef\n\
/stringwidth{.svg(strw)1 .call 1}.bdef		%fixme: height KO\n\
/translate{.svg(translate)2 .call0}.bdef\n\
\n\
/setgray{255 mul dup dup setrgbcolor}.bdef\n\
% abcm2ps syms.c\n\
/!{bind def}bind def\n\
/T/translate load def\n\
/M/moveto load def\n\
/RM/rmoveto load def\n\
/L/lineto load def\n\
/RL/rlineto load def\n\
/C/curveto load def\n\
/RC/rcurveto load def\n\
/SLW/setlinewidth load def\n\
/defl 0 def\n\
/dlw{0.7 SLW}!\n\
/xymove{/x 2 index def/y 1 index def M}!\n\
/showc{dup stringwidth pop .5 mul neg 0 RM show}!\n\
%\n\
% abcm2ps internal glyphs\n\
/arp{.svg(arp)3 .call0}.bdef\n\
/ltr{.svg(ltr)3 .call0}.bdef\n\
/ft0{(acc-1).svg(xygl)3 .call0}.bdef\n\
/nt0{(acc3).svg(xygl)3 .call0}.bdef\n\
/sh0{(acc1).svg(xygl)3 .call0}.bdef\n\
/dsh0{(acc2).svg(xygl)3 .call0}.bdef\n\
/trl{(trl).svg(xygl)3 .call0}.bdef\n\
/lmrd{(lmrd).svg(xygl)3 .call0}.bdef\n\
/turn{(turn).svg(xygl)3 .call0}.bdef\n\
/umrd{(umrd).svg(xygl)3 .call0}.bdef\n\
/y0{.svg(y0)1 .call}.bdef\n\
/y1{.svg(y1)1 .call}.bdef\n")

} // Psvg()

// inject code inside the core
abc2svg.inject += '\
function svgcall(f, x, y, v1, v2) {\n\
    var	xy = psvg.getorig();\n\
	psvg.ps_flush();\n\
	f((x + xy[0]) * stv_g.scale, y - xy[1], v1, v2)\n\
}\n\
Abc.prototype.arpps = function(val, x, y) { svgcall(out_arp, x, y, val) }\n\
Abc.prototype.ltrps = function(val, x, y) { svgcall(out_ltr, x, y, val) }\n\
Abc.prototype.xyglsps = function (str, x, y, gl) {\n\
	svgcall(out_deco_str, x, y, gl, str)\n\
}\n\
Abc.prototype.xyglvps = function(val, x, y, gl) {\n\
	svgcall(out_deco_val, x, y, gl, val)\n\
}\n\
Abc.prototype.xyglps = function(x, y, gl) { svgcall(xygl, x, y, gl) }\n\
Abc.prototype.get_y = function(st, y) { return y + staff_tb[st].y }\n\
Abc.prototype.stv_g = stv_g\n\
Abc.prototype.psget_x = function() {\n\
	return posx / stv_g.scale\n\
}\n\
Abc.prototype.psget_y = function() {\n\
	return stv_g.started ? stv_g.dy : posy\n\
}\n\
\
	psvg = new Psvg(self);\n\
	psdeco = psvg.psdeco;\n\
	psxygl = psvg.psxygl\n\
'
