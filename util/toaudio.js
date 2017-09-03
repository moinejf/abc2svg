// toaudio.js - audio generation
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

// Audio creation
function Audio() {

// constants from Abc
var	BAR = 0,
	CLEF = 1,
	GRACE = 4,
	KEY = 5,
	NOTE = 8,
	TEMPO = 14,
	BASE_LEN = 1536,

	scale = new Uint8Array([0, 2, 4, 5, 7, 9, 11]),	// note to pitch conversion

	a_e,				// event array

	p_time,				// last playing time
	abc_time,			// last ABC time
	play_factor;			// play time factor

// clear the playing events and return the old ones
    Audio.prototype.clear = function() {
	var a_pe = a_e;
	a_e = null
	return a_pe
    } // clear()

// add playing events from the ABC model
    Audio.prototype.add = function(s,			// starting symbol
				 voice_tb) {		// voice table
	var	bmap = new Int8Array(7), // measure base map
		map = new Int8Array(70), // current map - 10 octaves
		i, n, dt, d,
		rep_st_i,		// repeat start index
		rep_st_t,		// and time
		rep_en_i,		// repeat stop index
		rep_en_t,		// and time
		rep_en_map = new Int8Array(7), // and accidentals
		transp			// clef transposition per voice

	// set the transpositions
	function set_voices() {
		var v, s

		transp = new Int8Array(voice_tb.length)
		for (v = 0; v < voice_tb.length; v++) {
			s = voice_tb[v].clef;
			transp[s.v] = (!s.clef_octave || s.clef_oct_transp) ?
					0 : s.clef_octave
		}
	} // set_voices()

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

	// convert ABC pitch to MIDI index
	function pit2mid(s, i) {
		var	n, oct,
			p = s.notes[i].pit + 12, // pitch from C0
			a = s.notes[i].acc

		if (transp[s.v])
			p += transp[s.v]
		if (a)
			map[p] = a == 3 ? 0 : a; // (3 = natural)
		return ((p / 7) | 0) * 12 + scale[p % 7] + map[p]
	} // pit2mid()

	function play_dup(s) {
		var i, n, en_t, dt, e;

		dt = p_time - rep_st_t
		for (i = rep_st_i; i < rep_en_i; i++) {
			e = a_e[i];
			a_e.push([e[0],		// source index
				e[1] + dt,	// time
				e[2],		// instrument
				e[3],		// MIDI note
				e[4]])		// duration
		}
	} // play_dup()

	// handle the ties
	function do_tie(s, i, d) {
		var	j, n, s2, pit, end_time,
			note = s.notes[i],
			tie = note.ti1;

		pit = note.pit;
		end_time = s.time + s.dur
		for (s2 = s.next; ; s2 = s2.next) {
			if (!s2
			 || s2.time != end_time)
				return d
			if (s2.type == NOTE)
				break
		}
		n = s2.notes.length
		for (j = 0; j < n; j++) {
			note = s2.notes[j]
			if (note.pit == pit) {
				d += s2.dur / play_factor;
				note.ti2 = true;
				return note.ti1 ? do_tie(s2, j, d) : d
			}
		}
		return d
	} // do_tie()

	// generate the grace notes
	function gen_grace(s) {
		var	g, i, n, t,
			d = BASE_LEN / 16,
			next = s.next

		if (next.type != NOTE) {
			// fixme: reduce the duration of the previous note
			// fixme: to do later
			for (g = s.extra; g; g = g.next) {
				if (g.type != NOTE)
					continue
				for (i = 0; i <= g.nhd; i++)
					pit2mid(g, i)
			}
			return
		}
		if (next.dur > BASE_LEN / 4)
			d *= 2
		else if (next.dur < BASE_LEN / 8)
			d = next.dur / 2;
		n = 0
		for (g = s.extra; g; g = g.next)
			if (g.type == NOTE)
				n++;
		next.time += d;
		next.dur -= d;
		d /= n * play_factor;
		t = p_time
		for (g = s.extra; g; g = g.next) {
			if (g.type != NOTE)
				continue
			gen_notes(g, t, d);
			t += d
		}
	} // gen_grace()

	// generate the notes
	function gen_notes(s, t, d) {
		for (var i = 0; i <= s.nhd; i++) {
			if (s.notes[i].ti2)
				continue
			a_e.push([
				s.istart,
				t,
				s.p_v.instr,
				pit2mid(s, i),
				s.notes[i].ti1 ? do_tie(s, i, d) : d])
		}
	} // gen_note()

	// add() main

	set_voices();			// initialize the voice parameters
	key_map(voice_tb[0].key)	// init accidental map from key sig.

	if (!a_e) {			// if first call
		a_e = []
		abc_time = rep_st_t =
			p_time =
			rep_st_i = rep_en_i = 0;
		play_factor = BASE_LEN / 4 * 120 / 60	// default: Q:1/4=120
	} else if (s.time < abc_time) {
		abc_time = rep_st_t = s.time
	}

	// loop on the symbols
	while (s) {
		if (s.type == TEMPO
		 && s.tempo) {
			d = 0;
			n = s.tempo_notes.length
			for (i = 0; i < n; i++)
				d += s.tempo_notes[i];
			play_factor = d * s.tempo / 60
		}

		dt = s.time - abc_time
		if (dt > 0) {
			p_time += dt / play_factor;
			abc_time = s.time
		}

		switch (s.type) {
		case BAR:
//fixme: handle different keys per staff
//			if (s.st != 0)
			if (s.v != 0)
				break
//fixme: handle the ties on repeat
			// right repeat
			if (s.bar_type[0] == ':') {
				if (rep_en_i == 0) {
					rep_en_i = a_e.length;
					rep_en_t = p_time
				} else {
					for (i = 0; i < 7; i++)
						bmap[i] = rep_en_map[i]
				}
				play_dup(s);
				p_time += rep_en_t - rep_st_t
			}

			// left repeat
			if (s.bar_type[s.bar_type.length - 1] == ':') {
				rep_st_i = a_e.length;
				rep_st_t = p_time;
				rep_en_i = 0;
				rep_en_t = 0

			// 1st time repeat
			} else if (s.text && s.text[0] == '1') {
				rep_en_i = a_e.length;
				rep_en_t = p_time;
				bar_map()
				for (i = 0; i < 7; i++)
					rep_en_map[i] = bmap[i]
				break
			}

			bar_map()
			break
		case CLEF:
			transp[s.v] = (!s.clef_octave || s.clef_oct_transp) ?
					0 : s.clef_octave
			break
		case GRACE:
			gen_grace(s)
			break
		case KEY:
//fixme: handle different keys per staff
			if (s.st != 0)
				break
			key_map(s)
			break
		case NOTE:
			gen_notes(s, p_time, s.dur / play_factor)
			break
		}
		s = s.ts_next
	}
    } // add()

} // Audio

// nodejs
if (typeof module == 'object' && typeof exports == 'object')
	exports.Audio = Audio
