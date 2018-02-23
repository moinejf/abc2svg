// abc2svg - modules.js - module handling
//
// Copyright (C) 2018 Jean-Francois Moine
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

function Modules() {
    var modules = {
		beginps: { fn: 'psvg-1.js', init: 'psvg_init(abc)' },
		grid: { fn: 'grid-1.js', init: 'Grid(abc)' }
	},
	all_m = /beginps|grid/g,
	nreq = 0,
	cbf					// callback function

	// scan the file and find the required modules
	// @file: ABC file
	// @abc: Abc instance - if undefined = web, otherwise = batch
	// @relay: when web, callback function for continuing the treatment
	// return true when all modules are loaded
	function load(file, abc, relay) {

		// test if some keyword in the file
	    var	m, r,nreq_i,
		all = file.match(all_m)

		if (!all)
			return true;
		nreq_i = nreq;
		cbf = relay			// (only one callback function)
		for (var i = 0; i < all.length; i++) {
			m = modules[all[i]]
			if (m.loaded)
				continue

			// check if really a command
			r = new RegExp('(^|\\n)(%.|I:) *' + all[i] + '\\s')
			if (!r.test(file))
				continue

			m.loaded = true

			// load the module
			if (!relay) {			// batch
				loadRelativeToScript(m.fn)
			} else {			// web
				nreq++;
				loadjs(m.fn, function() {
					nreq--;
					if (nreq == 0)
						cbf()
				})
			}
		}
		if (relay)		// web
			return nreq == nreq_i;
		init(abc)		// batch
		return true
	}

	// initialize all the modules
	// This function is called
	// - from the Abc instance on object creation
	// - from modules.load when the Abc instance has already been created
	function init(abc) {
		for (var i in modules) {
			var m = modules[i]
			if (!m.loaded)
				continue
			eval(m.init)
		}
	}

	return {
		load: load,
		init: init
	}
}

var modules = Modules()

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.modules = modules
}
