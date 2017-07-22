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
	this.add = function(s,		// starting symbol
			    voice_tb) {	// voice table

		var	scale = [0, 2, 4, 5, 7, 9, 11],	// note to pitch
			bmap = [],			// measure base map
			map = [],			// current map - 10 octaves
			i, n, pit, lrep, g, v,
			rep_en_map = [],
			transp = []			// transposition per voice

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
		function pit2midi(s, i) {
			var	p = s.notes[i].apit + 19,	// pitch from lowest C
				a = s.notes[i].acc

			if (a)
				map[p] = a == 3 ? 0 : a	// (3 = '=')
			if (transp[s.v])
				p += transp[s.v]
			return Math.floor(p / 7) * 12 + scale[p % 7] + map[p]
		} // pit2midi()

		// handle the ties
		function do_tie(s, i) {
			var	j, n, s2, note2, pit, str_tie,
				note = s.notes[i],
				tie = note.ti1,
				end_time

			pit = note.apit;			// absolute pitch
			end_time = s.time + s.dur
			for (s2 = s.next; ; s2 = s2.next) {
				if (!s2
				 || s2.time != end_time)
					return
				if (s2.type == NOTE)
					break
			}
			n = s2.notes.length
			for (j = 0; j < n; j++) {
				note2 = s2.notes[j]
				if (note2.apit == pit) {
					note2.midi = note.midi
					if (note2.ti1)
						do_tie(s2, j)
					break
				}
			}
		} // do_tie()

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
		lrep = false

		while (s) {
			switch (s.type) {
			case BAR:
//fixme: handle different keys per staff
				if (s.st != 0)
					break
//fixme: handle the ties on repeat
				// left repeat
				if (s.bar_type[s.bar_type.length - 1] == ':') {
					lrep = false

				// 1st time repeat
				} else if (s.text && s.text[0] == '1') {
					lrep = true;
					bar_map()
					for (i = 0; i < 7; i++)
						rep_en_map[i] = bmap[i]
					break

				// right repeat
				} else if (s.bar_type[0] == ':') {
					if (lrep) {
						for (i = 0; i < 7; i++)
							bmap[i] = rep_en_map[i]
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
						if (g.notes[i].midi != undefined)
							continue
						pit = g.notes[i].apit;
						str_tie = '_' + g.st + pit;
						g.notes[i].midi = pit2midi(g, i)
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
					if (s.notes[i].midi != undefined)
						continue
					pit = s.notes[i].apit;
					str_tie = '_' + s.st + pit;
					s.notes[i].midi = pit2midi(s, i)
					if (s.notes[i].ti1)
						do_tie(s, i)
				}
				break
			}
			s = s.ts_next
		}
	}
} // end AbcMidi
