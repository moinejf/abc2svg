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

// Abc functions used by the modules
Abc.prototype.add_style = function(s) { style += s };
Abc.prototype.cfmt = function() { return cfmt };
Abc.prototype.get_a_gch = function() { return a_gch };
Abc.prototype.get_cur_sy = function() { return cur_sy };
Abc.prototype.get_curvoice = function() { return curvoice };
Abc.prototype.get_delta_tb = function() { return delta_tb };
Abc.prototype.get_decos = function() { return decos };
Abc.prototype.get_fname = function() { return parse.ctx.fname };
Abc.prototype.get_font = get_font;
Abc.prototype.get_font_style = function() { return font_style };
Abc.prototype.get_glyphs = function() { return glyphs };
Abc.prototype.get_img = function() { return img };
Abc.prototype.get_maps = function() { return maps };
Abc.prototype.get_multi = function() { return multicol };
Abc.prototype.get_newpage = function() {
	if (block.newpage) {
		block.newpage = false;
		return true
	}
};
Abc.prototype.get_posy = function() { var t = posy; posy = 0; return t };
Abc.prototype.get_staff_tb = function() { return staff_tb };
Abc.prototype.get_top_v = function() { return par_sy.top_voice };
Abc.prototype.get_tsfirst = function() { return tsfirst };
Abc.prototype.get_voice_tb = function() { return voice_tb };
Abc.prototype.info = function() { return info };
Abc.prototype.set_tsfirst = function(s) { tsfirst = s };
Abc.prototype.set_xhtml = function(wt) {
    var wto = write_text;
	write_text = wt
	return wto
};
Abc.prototype.sort_pitch = sort_pitch;
Abc.prototype.stv_g = function() { return stv_g };
Abc.prototype.svg_flush = svg_flush;

    var	hook_init		// set after setting the first module hooks

    // export functions and/or set module hooks
    function set_hooks() {
    var	h = abc2svg.modules.hooks,
	gh = abc2svg.modules.g_hooks

	function set_hs(hs) {
	    var	of, h
		for (var k = 0; k < hs.length; k++) {
			h = hs[k]
			if (typeof h == "string") {
				eval("Abc.prototype." + h + "=" + h)
			} else {
				eval("of=" + h[0] + ";" +
					h[0] + "=" + h[1] + ".bind(self,of)")
			}
		}
	} // set_hs()

	if (hook_init) {			// if new modules
		if (h.length) {
			set_hs(h);
			gh.push.apply(gh, h);
			abc2svg.modules.hooks = []
		}
	} else {				// all modules
		if (h.length) {
			gh.push.apply(gh, h);
			abc2svg.modules.hooks = []
		}
		set_hs(gh);
		hook_init = true
	}
    } // set_hooks()

    var	self = this

}	// end of Abc()

// compatibility
var Abc = abc2svg.Abc

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abc2svg = abc2svg;
	exports.Abc = Abc
}
