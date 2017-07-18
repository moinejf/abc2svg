// abc2svg - pstail.js
//
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

// end of the Abc object
// ps functions

// ---- functions to call the PS interpreter
// common part
function pscall(f, x, y, script) {
	svgobj.setorig(posx / stv_g.scale,
			stv_g.started ? stv_g.dy : posy);
	wpsobj.parse(script +
		(x / stv_g.scale).toFixed(2) + ' ' + y.toFixed(2) + ' ' + f);
	svgobj.setg(0);
	output.push(svgbuf);
	svgbuf = ''
	return true
}

// try to generate a decoration by PS
function psdeco(f, x, y, de) {
	var	dd, de2, script, defl,
		Os = wpsobj.parse('/' + f + ' where'),
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
//		if (de2) {
			x = de2.x;
			y = de2.y + staff_tb[de2.st].y
//		} else {
//fixme: should emit a warning
//			x -= 30
//		}
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
function psxygl(x, y, gl){
	var	Os = wpsobj.parse('/' + gl + ' where'),
		A = Os.pop()
	if (!A) {
//		wpsobj.parse('dlw');
//		svgobj.g_upd();
//		output.push(svgbuf);
//		svgbuf = ''
		return false
	}
	Os.pop()
	return pscall(gl, x, y, 'dlw ')
}

// ---- functions called from the PS interpreter
//function psxy() {
//	var xy = svgobj.getorig()
//	if (svgbuf) {
//		output.push(svgbuf);
//		svgbuf = ''
//	}
//	return xy
//}
function svgcall(f, x, y, v1, v2) {
	var xy = svgobj.getorig()
	if (svgbuf) {
		output.push(svgbuf);
		svgbuf = ''
	}
	f((x + xy[0]) * stv_g.scale, y - xy[1], v1, v2)
}

// output an arpeggio
this.arpps = function(val, x, y) {
	svgcall(out_arp, x, y, val)
}

// output a long trill
this.ltrps = function(val, x, y) {
	svgcall(out_ltr, x, y, val)
}

// output a deco with string
this.xyglsps = function(str, x, y, gl) {
	svgcall(out_deco_str, x, y, gl, str)
}

// output a deco with value
this.xyglvps = function(val, x, y, gl) {
	svgcall(out_deco_val, x, y, gl, val)
}

// output a glyph
this.xyglps = function(x, y, gl) {
	svgcall(xygl, x, y, gl)
}
this.get_y = function(st, y) {
	return y + staff_tb[st].y
}

// initialize
	abc2svg_init();
	var	svgobj = new Svg,
		wpsobj = new Wps,
		abcobj = this;
	wpsobj.parse(psvg_op,
"/!{bind def}bind def\n\
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
% abcm2ps internal glyphs - see psvg.js\n\
/arp{.svg(arp)3 .call0}.bdef\n\
/ltr{.svg(ltr)3 .call0}.bdef\n\
/ft0{(acc-1).svg(xygl)3 .call0}.bdef\n\
/nt0{(acc3).svg(xygl)3 .call0}.bdef\n\
/sh0{(acc1).svg(xygl)3 .call0}.bdef\n\
/dsh0{(acc2).svg(xygl)3 .call0}.bdef\n\
/trl{(trl).svg(xygl)3 .call0}.bdef\n\
/lmrd{(lmrd).svg(xygl)3 .call0}.bdef\n\
/umrd{(umrd).svg(xygl)3 .call0}.bdef\n\
/y0{.svg(y0)1 .call}.bdef\n\
/y1{.svg(y1)1 .call}.bdef\n")

	return this
}	// end of Abc()
