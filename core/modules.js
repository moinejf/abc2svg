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
		ambitus: { fn: 'ambitus-1.js' },
		beginps: { fn: 'psvg-1.js' },
		break: { fn: 'break-1.js' },
		capo: { fn: 'capo-1.js' },
		clip: { fn: 'clip-1.js' },
		voicecombine: { fn: 'combine-1.js' },
		diagram: { fn: 'diag-1.js' },
		grid: { fn: 'grid-1.js' },
		MIDI: { fn: 'MIDI-1.js' },
		percmap: { fn: 'perc-1.js' }
	},
	all_m = /ambitus|beginps|break|capo|clip|voicecombine|diagram|grid|MIDI|percmap/g,
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
			if (eval('typeof ' + m.init) == "function")
				continue		// already loaded

			// load the module
			if (!relay) {			// batch
				loadRelativeToScript(m.fn)
			} else {			// web
				nreq++;
				loadjs(m.fn,
				    function() {	// if success
					nreq--;
					if (nreq == 0)
						cbf()},
				    function() {	// if error
					user.errmsg('error loading ' + m.fn);
					nreq--
					if (nreq == 0)
						cbf()
				    })
			}
		}
		if (relay)		// web
			return nreq == nreq_i;
		return true
	}

	return {
		load: load
	}
}

var modules = Modules()

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.modules = modules
}
