// abc2svg - tail.js
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

function psdeco() { return false }
function psxygl() { return false }

// initialize
	font_init();
	init_tune()

// export for modules
Abc.prototype.clone = clone;
Abc.prototype.deco_cnv = deco_cnv;
Abc.prototype.decos = decos;
Abc.prototype.err_bad_val_s = err_bad_val_s;
Abc.prototype.font_class = font_class;
Abc.prototype.gch_tr1 = gch_tr1;
Abc.prototype.get_cfmt = function(k) { return cfmt[k] };
Abc.prototype.get_cur_sy = function() { return cur_sy };
Abc.prototype.get_curvoice = function() { return curvoice };
Abc.prototype.get_fname = function() { return parse.ctx.fname };
Abc.prototype.get_font = get_font;
Abc.prototype.get_font_style = function() { return font_style };
Abc.prototype.get_info = function(k) { return info[k] };
Abc.prototype.get_img = function() { return img };
Abc.prototype.get_multi = function() { return multicol };
Abc.prototype.get_newpage = function() {
	if (block.newpage) {
		block.newpage = false;
		return true
	}
};
Abc.prototype.get_posy = function() { var t = posy; posy = 0; return t };
Abc.prototype.get_top_v = function() { return par_sy.top_voice };
Abc.prototype.get_tsfirst = function() { return tsfirst };
Abc.prototype.glovar = glovar;
Abc.prototype.glyphs = glyphs;
Abc.prototype.maps = maps;
Abc.prototype.set_font = set_font;
Abc.prototype.set_tsfirst = function(s) { tsfirst = s };
Abc.prototype.set_v_param = set_v_param;
Abc.prototype.set_xhtml = function(wt) {
    var wto = write_text;
	write_text = wt
	return wto
};
Abc.prototype.sort_pitch = sort_pitch;
Abc.prototype.strwh = strwh;
Abc.prototype.svg_flush = svg_flush;
Abc.prototype.syntax = syntax;
Abc.prototype.unlksym = unlksym;
Abc.prototype.voice_tb = voice_tb

    var	self = this

}	// end of Abc()

// module hooks
abc2svg.inject = ''	// new modules
abc2svg.g_inject = ''	// all modules

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abc2svg = abc2svg;
	exports.Abc = Abc
}
