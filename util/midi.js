//#javascript
// Set the MIDI pitches in the notes
//
// Copyright (C) 2015-2017 Jean-Francois Moine
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

// Usage:
//	// Define a get_abcmodel() callback function
//	// This one is called by abc2svg after ABC parsing 
//	user.get_abcmodel = my_midi_callback
//
//	// In this function
//	function my_midi_callback(tsfirst, voice_tb, music_types, info) {
//
//		// Create a AbcMIDI instance
//		var abcmidi = new AbcMIDI();
//
//		// and set the MIDI pitches
//		abcmidi.add(tsfirst, voice_tb);
//
//		// The MIDI pitches are stored in the notes
//		//	s.notes[i].midi
//	}

// AbcMIDI creation
function AbcMIDI() {

	// constants from Abc
	var	BAR = 0,
		CLEF = 1,
		GRACE = 4,
		KEY = 5,
		NOTE = 8

	// add MIDI pitches
	AbcMIDI.prototype.add = function(s,		// starting symbol
					voice_tb) {	// voice table

		var	scale = new Int8Array(		// note to pitch
					[0, 2, 4, 5, 7, 9, 11]),
			bmap = new Int8Array(7),	// measure base map
			map = new Int8Array(70),	// current map - 10 octaves
			i, n, g, v, p, a,
			tie_map = [],			// index = MIDI pitch
			tie_time= [],
			rep_tie_map = [],
			rep_tie_time = [],
			transp = [],			// transposition per voice
			note

		// re-initialize the map on bar
		function bar_map() {
			for (var j = 0; j < 10; j++)
				for (var i = 0; i < 7; i++)
					map[j * 7 + i] = bmap[i]
		} // bar_map()

		// define the note map
		function key_map(s) {
			for (var i = 0; i < 7; i++)
				bmap[i] = 0
			switch (s.k_sf) {
			case 7: bmap[6] = 1
			case 6: bmap[2] = 1
			case 5: bmap[5] = 1
			case 4: bmap[1] = 1
			case 3: bmap[4] = 1
			case 2: bmap[0] = 1
			case 1: bmap[3] = 1; break
			case -7: bmap[3] = -1
			case -6: bmap[0] = -1
			case -5: bmap[4] = -1
			case -4: bmap[1] = -1
			case -3: bmap[5] = -1
			case -2: bmap[2] = -1
			case -1: bmap[6] = -1; break
			}
			bar_map()
		} // key_map()

		// convert ABC pitch to MIDI
		function pit2midi(p, a) {
			if (a)
				map[p] = a == 3 ? 0 : a; // (3 = natural)
			return ((p / 7) | 0) * 12 + scale[p % 7] + map[p]
		} // pit2midi()

		// initialize the clefs and keys
		for (v = 0; v < voice_tb.length; v++) {
			n = voice_tb[v].clef
			if (!n.clef_octave
			 || n.clef_oct_transp)
				transp[v] = 0
			else
				transp[v] = n.clef_octave
		}
		key_map(voice_tb[0].key);	// init acc. map from key sig.

		while (s) {
			switch (s.type) {
			case BAR:
//fixme: handle different keys per staff
				if (s.st != 0)
					break
				// x times repeat
				if (s.text) {
					if (s.text[0] == '1') {	// 1st time
						rep_tie_map = [];
						rep_tie_time = []
						for (i in tie_map) {
							rep_tie_map[i] = tie_map[i];
							rep_tie_time[i] = tie_time[i]
						}
					} else if (rep_tie_map.length != 0) {
						tie_map = []
						tie_time = []
						for (i in rep_tie_map) {
							tie_map[i] = rep_tie_map[i];
							tie_time[i] = rep_tie_time[i]
						}
					}
				}
				bar_map()
				break
			case CLEF:
				if (!s.clef_octave
				 || s.clef_oct_transp) {
					transp[s.v] = 0
					break
				}
				transp[s.v] = s.clef_octave
				break
			case GRACE:
				for (g = s.extra; g; g = g.next) {
					if (!g.type != NOTE)
						continue
					for (i = 0; i <= g.nhd; i++) {
						note = g.notes[i];
						p = note.apit + 19
						if (transp[s.v])
							p += transp[s.v];
						note.midi = pit2midi(p, note.acc)
					}
				}
				break
			case KEY:
//fixme: handle different keys per staff
				if (s.st != 0)
					break
				key_map(s)
				break
			case NOTE:
				for (i = 0; i <= s.nhd; i++) {
					note = s.notes[i];
					p = note.apit + 19	// pitch from C-1
					if (transp[s.v])
						p += transp[s.v]
					if (tie_map[p]) {
						if (s.time > tie_time[p]) {
							delete tie_map[p]
							delete tie_time[p]
						} else {
							map[p] = tie_map[p]
						}
					}
					note.midi = pit2midi(p, note.acc)
					if (note.ti1) {
						if (note.acc)
							tie_map[p] = map[p];
						tie_time[p] = s.time + s.dur
					}
				}
				break
			}
			s = s.ts_next
		}
	}
} // end AbcMidi
