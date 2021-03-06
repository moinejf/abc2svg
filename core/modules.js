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

abc2svg.loadjs = function(fn, onsuccess, onerror) {
	if (onerror)
		onerror()
}

abc2svg.modules = {
		ambitus: { fn: 'ambitus-1.js' },
		beginps: { fn: 'psvg-1.js' },
		break: { fn: 'break-1.js' },
		capo: { fn: 'capo-1.js' },
		clip: { fn: 'clip-1.js' },
		voicecombine: { fn: 'combine-1.js' },
		diagram: { fn: 'diag-1.js' },
		grid: { fn: 'grid-1.js' },
		grid2: { fn: 'grid2-1.js' },
		MIDI: { fn: 'MIDI-1.js' },
		percmap: { fn: 'perc-1.js' },
	sth: { fn: 'sth-1.js' },
	all_m: new RegExp("ambitus|beginps|break|capo|clip|voicecombine|diagram|\
grid2|grid|MIDI|percmap|sth", 'g'),
	nreq: 0,
	hooks: [],
	g_hooks: [],

	// scan the file and find the required modules
	// @file: ABC file
	// @relay: (optional) callback function for continuing the treatment
	// @errmsg: (optional) function to display an error message if any
	//	This function gets one argument: the message
	// return true when all modules are loaded
	load: function(file, relay, errmsg) {

		function get_errmsg() {
			if (typeof user == 'object' && user.errmsg)
				return user.errmsg
			if (typeof printErr == 'function')
				return printErr
			if (typeof alert == 'function')
				return function(m) { alert(m) }
			if (typeof console == 'object')
				return console.log
			return function(){}
		}

		// test if some keyword in the file
	    var	m, r, nreq_i,
		all = file.match(this.all_m)

		if (!all)
			return true;
		nreq_i = this.nreq;
		this.cbf = relay ||		// (only one callback function)
			function(){}
		this.errmsg = errmsg || get_errmsg()

		for (var i = 0; i < all.length; i++) {
			m = abc2svg.modules[all[i]]
			if (m.loaded)
				continue

			// check if really a command
			r = new RegExp('(^|\\n)(%.|I:|\\[) *' + all[i] + '\\s')
			if (!r.test(file))
				continue

			m.loaded = true

			// load the module
				this.nreq++;
				abc2svg.loadjs(m.fn,
				    function() {	// if success
					if (--abc2svg.modules.nreq == 0)
						abc2svg.modules.cbf()
				    },
				    function() {	// if error
					abc2svg.modules.errmsg('error loading ' + m.fn);
					if (--abc2svg.modules.nreq == 0)
						abc2svg.modules.cbf()
				    })
		}
		return this.nreq == nreq_i
	}
} // modules
