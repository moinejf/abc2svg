// abc2svg - tail.js
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

    var	psdeco = function(f, x, y, de) { return false },
	psxygl = function(x, y, gl) { return false }

// try to install PostScript support
function ps_def(abcobj) {
	if (psvg || typeof Psvg != "function")
		return		// already installed or no support

// ---- Abc functions called from the PS interpreter
	function svgcall(f, x, y, v1, v2) {
	    var	xy = psvg.getorig();
		psvg.ps_flush();
		f((x + xy[0]) * stv_g.scale, y - xy[1], v1, v2)
	}

	// output an arpeggio
	Abc.prototype.arpps = function(val, x, y) {
		svgcall(out_arp, x, y, val)
	}

	// output a long trill
	Abc.prototype.ltrps = function(val, x, y) {
		svgcall(out_ltr, x, y, val)
	}

	// output a deco with string
	Abc.prototype.xyglsps = function(str, x, y, gl) {
		svgcall(out_deco_str, x, y, gl, str)
	}

	// output a deco with value
	Abc.prototype.xyglvps = function(val, x, y, gl) {
		svgcall(out_deco_val, x, y, gl, val)
	}

	// output a glyph
	Abc.prototype.xyglps = function(x, y, gl) {
		svgcall(xygl, x, y, gl)
	}

	Abc.prototype.get_y = function(st, y) {
		return y + staff_tb[st].y
	}

	Abc.prototype.set_ps = function(deco, xygl) {
		psdeco = deco;
		psxygl = xygl
	}
	Abc.prototype.stv_g = stv_g
	Abc.prototype.psget_x = function() {
		return posx / stv_g.scale
	}
	Abc.prototype.psget_y = function() {
		return stv_g.started ? stv_g.dy : posy
	}

	psvg = new Psvg(abcobj)
}

	Abc.prototype.ps_def = ps_def;

// initialize
	ps_def(this);
	font_init();
	init_tune()

}	// end of Abc()

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abc2svg = abc2svg;
	exports.Abc = Abc
}
