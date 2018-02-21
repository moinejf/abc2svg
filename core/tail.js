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

    var	psdeco = function(f, x, y, de) { return false },
	psxygl = function(x, y, gl) { return false }

// initialize
	font_init();
	init_tune()
	for (var i = 0; i < 128; i++)
		maci[i] = 0

	if (modules)
		modules.init(this)

}	// end of Abc()

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abc2svg = abc2svg;
	exports.Abc = Abc
}
