// psvg.js - small PS to SVG convertor for abc2svg

// Copyright (C) 2014-2017 Jean-Francois Moine
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

var svgbuf = ''

// PS functions
var psvg_op = "\
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
%/.e{.math(E)get}.bdef\n\
%/.ln2{.math(LN2)get}.bdef\n\
%/.ln10{.math(LN10)get}.bdef\n\
%/.log2e{.math(LOG2E)get}.bdef\n\
%/.log10e{.math(LOG10E)get}.bdef\n\
/.pi{.math(PI)get}.bdef\n\
%/.sqrt1_2{.math(SQRT1_2)get}.bdef\n\
%/.sqrt2{.math(SQRT2)get}.bdef\n\
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
%% SVG\n\
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
%% PostScript\n\
\n\
%/.deg2rad{.pi 180 div mul}.bdef\n\
%/.rad2deg{180 .pi div mul}.bdef\n\
\n\
%/clip{.clip}.bdef\n\
%/rectclip{.clearRect}.bdef\n\
%/rectfill{.fillRect}.bdef\n\
%/rectstroke{.strokeRect}.bdef\n\
%/arcto{.arcTo}.bdef\n\
\n\
%/setlinecap{.setLineCap}.bdef % TODO\n\
%/setlinejoin{.setLineJoin}.bdef % TODO\n\
%/setmiterlimit{.setMiterLimit}.bdef\n\
\n\
%/currentlinewidth{.getLineWidth}.bdef\n\
%/currentlinecap{&lt;&lt;/butt 0/round 1/square 2&gt;&gt; .getLineCap get}.bdef\n\
%/currentlinejoin{&lt;&lt;/miter 0/round 1/bevel 2&gt;&gt; .getLineJoin get}.bdef\n\
%/currentmiterlimit{.getMiterLimit}.bdef\n\
\n\
/setgray{255 mul dup dup setrgbcolor}.bdef\n\
%/setcmykcolor{setrgbcolor pop}.bdef % TODO\n\
%/sethsbcolor{setrgbcolor}.bdef % TODO\n\
%/clippath{0 0 .gcanvas(width)get .gcanvas(height)get .rect}.bdef % TODO\n\
\n\
%/currentflat{42}.bdef % TODO\n\
%/setflat{pop}.bdef % TODO\n\
\n\
%/showpage{}.bdef % TODO\n\
%/grestoreall{}.bdef % TODO\n\
%/readonly{}.bdef % TODO\n\
%/currentfile{(url?)}.bdef % TODO\n\
%/eexec{pop}.bdef % TODO\n\
%/findfont{}.bdef % TODO\n\
%/scalefont{pop}.bdef % TODO\n\
%/setfont{pop}.bdef % TODO C.font = N + \"pt \" + F.V;\n\
%/stopped{}.bdef % TODO\n\
%/loop{}.bdef % TODO !!!\n\
%/string{}.bdef % TODO\n\
%/cvi{}.bdef % TODO\n\
%/pathbbox{}.bdef % TODO\n\
%/urx{}.bdef % TODO\n\
%/ury{}.bdef % TODO\n\
%/llx{}.bdef % TODO\n\
%/lly{}.bdef % TODO\n\
%/pagewidth{}.bdef % TODO\n\
%/pageheight{}.bdef % TODO\n\
%/inwidth{}.bdef % TODO\n\
%/inheight{}.bdef % TODO\n\
%/usertime{}.bdef % TODO\n\
%/srand{}.bdef % TODO\n\
"
//false .strictBind\n\

// SVG functions - adapted from abcm2ps svg.c
function Svg() {
    var	g = 0,			// graphic state
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
	path

    function getorig() {
//	setg(1);
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
//	if (gcur.linewidth != 0.7)
//		svgbuf += ' stroke-width="' + gcur.linewidth.toFixed(2) + '"';
	output_font(false)
	if (gcur.rgb)
		svgbuf += ' style="color:' + gcur.rgb + '"';
	svgbuf += ">\n";
	g = 1
    }
//    // update the graphic context before SVG output - called on glyph output
//    function g_upd() {
//	if (gchg || g == 2)
//		defg1()
//    }
    function objdup(obj) {
//	if (!obj || typeof(obj) != 'object')
//		return obj
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
	if (!path) {
		setg(1);
		gcur.px = gcur.cx;
		gcur.py = gcur.cy;
		path = '<path d="m' + (gcur.xoffs + gcur.cx).toFixed(2) +
			' ' + (gcur.yoffs - gcur.cy).toFixed(2) + '\n'
	}
    }
    function path_end() {
//	setg(1);
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

// exported functions
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
    function arcn(x, y, r, a1, a2) {
	arc(x, y, r, a1, a2, true)
    }
    function closepath() {
	if (path && gcur.cx)
		rlineto(gcur.px - gcur.cx, gcur.py - gcur.cy)
    }
    function cx() {
	return gcur.cx
    }
    function cy() {
	return gcur.cy
    }
    function curveto(x1, y1, x2, y2, x, y) {
	path_def();
	path += "\tC" + 
		(gcur.xoffs + x1).toFixed(2) + " " + (gcur.yoffs - y1).toFixed(2) + " " +
		(gcur.xoffs + x2).toFixed(2) + " " + (gcur.yoffs - y2).toFixed(2) + " " +
		(gcur.xoffs + x).toFixed(2) + " " + (gcur.yoffs - y).toFixed(2) + "\n";
	gcur.cx = x;
	gcur.cy = y
    }
    function eofill() {
	path_end();
	svgbuf += '" fill-rule="evenodd" fill="currentColor"/>\n'
    }
    function fill() {
	path_end();
	svgbuf += '" fill="currentColor"/>\n'
    }
    function gsave() {
//	setg(1);
	gc_stack.push(objdup(gcur))
    }
    function grestore() {
//	setg(1);
	gcur = gc_stack.pop();
	gchg = true
    }
    function lineto(x, y) {
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
    function moveto(x, y) {
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
    function newpath() {
//	path_def()
	gcur.cx = gcur.cy = undefined
    }
    function rcurveto(x1, y1, x2, y2, x, y) {
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
    function rmoveto(x, y) {
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
    function rotate(a) {
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
    function scale(sx, sy) {
//	setg(0);
	gcur.xoffs /= sx;
	gcur.yoffs /= sy;
	gcur.cx /= sx;
	gcur.cy /= sy;
	gcur.xscale *= sx;
	gcur.yscale *= sy;
	gchg = true
    }
    function selectfont(s, h) {
	s = s.nm;			// Symbol
	if (font_s != h || s != font_n) {
		gcur.font_n_old = gcur.font_n;
		gcur.font_n = s;
		gcur.font_s = h;
		gchg = true
	}
    }
    function setdash(a, o) {
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
    function setlinewidth(w) {
//	if (w != gcur.linewidth) {
		gcur.linewidth = w
//		gchg = true
//	}
    }
    function setorig(x, y) {
	gcur.xorig = gcur.xoffs = x;
	gcur.yorig = gcur.yoffs = y;
	gcur.cx = 0;
	gcur.cy = 0
    }
    function setrgbcolor(r, g, b) {
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
    function show(s) {
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
	svgbuf += s
	if (span)
		svgbuf += "</tspan>";
	gcur.cx = x + strw(s)
    }
    function stroke() {
	path_end()
	if (gcur.linewidth != 0.7)
		svgbuf += '" stroke-width="' + gcur.linewidth.toFixed(2);
	svgbuf += '" stroke="currentColor" fill="none"' + gcur.dash + '/>\n'
    }
    function translate(x, y) {
	gcur.xoffs += x;
	gcur.yoffs -= y;
	gcur.cx -= x;
	gcur.cy -= y
    }
	Svg.prototype.arc = arc;
	Svg.prototype.arcn = arcn;
	Svg.prototype.closepath = closepath;
	Svg.prototype.cx = cx;
	Svg.prototype.cy = cy;
	Svg.prototype.curveto = curveto;
//	Svg.prototype.defg1 = defg1;
	Svg.prototype.eofill = eofill;
	Svg.prototype.fill = fill;
//	Svg.prototype.g_upd = g_upd;
	Svg.prototype.getorig = getorig;
	Svg.prototype.grestore = grestore;
	Svg.prototype.gsave = gsave;
	Svg.prototype.moveto = moveto;
	Svg.prototype.newpath = newpath;
	Svg.prototype.lineto = lineto;
	Svg.prototype.rcurveto = rcurveto;
	Svg.prototype.rlineto = rlineto;
	Svg.prototype.rmoveto = rmoveto;
	Svg.prototype.rotate = rotate;
	Svg.prototype.scale = scale;
	Svg.prototype.selectfont = selectfont;
	Svg.prototype.setdash = setdash;
	Svg.prototype.setrgbcolor = setrgbcolor;
	Svg.prototype.setg = setg;
	Svg.prototype.setlinewidth = setlinewidth;
	Svg.prototype.setorig = setorig;
	Svg.prototype.show = show;
	Svg.prototype.stroke = stroke;
	Svg.prototype.strw = strw;
	Svg.prototype.translate = translate;

// abcm2ps functions - see pstail.js
this.arp = function(val, x, y) { abcobj.arpps(val, x, y) }
this.ltr = function(val, x, y) { abcobj.ltrps(val, x, y) }
this.xygl = function(x, y, gl) { abcobj.xyglps(x, y, gl) }
this.xygls = function(str, x, y, gl) { abcobj.xyglsps(str, x, y, gl) }
this.xyglv = function(val, x, y, gl) { abcobj.xyglvps(val, x, y, gl) }
this.y0 = function(y) { return abcobj.get_y(0, y) }
this.y1 = function(y) { return abcobj.get_y(1, y) }
}
