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

// ToAudio creation
function ToAudio() {

// constants from Abc
var	BAR = 0,
	CLEF = 1,
	GRACE = 4,
	KEY = 5,
	NOTE = 8,
	REST = 10,
	TEMPO = 14,
	BASE_LEN = 1536,

	scale = new Uint8Array([0, 2, 4, 5, 7, 9, 11]),	// note to pitch conversion

	a_e,				// event array

	p_time,				// last playing time
	abc_time,			// last ABC time
	play_factor;			// play time factor

// clear the playing events and return the old ones
    ToAudio.prototype.clear = function() {
	var a_pe = a_e;
	a_e = null
	return a_pe
    } // clear()

// add playing events from the ABC model
    ToAudio.prototype.add = function(start,		// starting symbol
				 voice_tb) {		// voice table
	var	bmap = new Float32Array(7), // measure base map
		map = new Float32Array(70), // current map - 10 octaves
		i, n, dt, d,
		rep_st_s,		// start of sequence to be repeated
		rep_en_s,		// end
		rep_nx_s,		// restart at end of repeat
		rep_st_transp,		// transposition at start of repeat sequence
		rep_st_map = new Float32Array(70), // accidentals
		rep_st_fac,		// and play factor
		transp,			// clef transposition per voice
		s = start

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
	    if (s.k_bagpipe) {
		// detune for just intonation in A (C is C#, F is F# and G is Gnat)
		bmap = [100-13.7, -2, 2, 100-15.6, -31.2, 0, 3.9]
		for (var i = 0; i < 7; i++)
			bmap[i] = (bmap[i] + 150.6) / 100 // 'A' bagpipe = 480Hz
				// 150.6 = (Math.log2(480/440) - 1)*1200
	    } else {
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
	    }
		bar_map()
	} // key_map()

	// convert ABC pitch to MIDI index
	function pit2mid(s, i) {
		var	n, oct,
			note = s.notes[i];
			p = note.pit + 19, // pitch from C-1
			a = note.acc

		if (transp[s.v])
			p += transp[s.v]
		if (a) {
			if (a == 3)		// (3 = natural)
				a = 0
			else if (note.micro_n)
				a = (a < 0 ? -note.micro_n : note.micro_n) /
						note.micro_d * 2;
			map[p] = a
		}
		return ((p / 7) | 0) * 12 + scale[p % 7] + map[p]
	} // pit2mid()

	// handle the ties
	function do_tie(s, note, d) {
		var	n,
			end_time = s.time + s.dur,
			pit = note.pit,
			p = pit + 19,
			a = note.acc

		if (transp[s.v])
			p += transp[s.v]

		// search the end of the tie
		for (s = s.next; ; s = s.next) {
			if (!s)
				return d

			// skip if end of sequence to be repeated
			if (s == rep_en_s) {
				var v = s.v;
				s = rep_nx_s.ts_next
				while (s && s.v != v)
					s = s.ts_next
				if (!s)
					return d
				end_time = s.time
			}
			if (s.time != end_time)
				return d
			if (s.type == NOTE)
				break
		}
		n = s.notes.length
		for (i = 0; i < n; i++) {
			note = s.notes[i]
			if (note.pit == pit) {
				d += s.dur / play_factor;
				note.ti2 = true
				return note.ti1 ? do_tie(s, note, d) : d
			}
		}
		return d
	} // do_tie()

	// generate the grace notes
	function gen_grace(s) {
		var	g, i, n, t, d,
			next = s.next

		// before beat
		if (s.sappo) {
			d = BASE_LEN / 16
		} else if ((!next || next.type != NOTE)
			&& s.prev && s.prev.type == NOTE) {
			d = s.prev.dur / 2
		} else {

			// after beat
			after = true
			if (!next.dots)
				d = next.dur / 2
			else if (next.dots == 1)
				d = next.dur / 3
			else
				d = next.dur * 2 / 7;
			next.time += d;
			next.dur -= d
		}
		n = 0
		for (g = s.extra; g; g = g.next)
			if (g.type == NOTE)
				n++;
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
		    var	note = s.notes[i]
			if (note.ti2)
				continue
			a_e.push([
				s.istart,
				t,
				s.p_v.instr,
				pit2mid(s, i),
				note.ti1 ? do_tie(s, note, d) : d])
		}
	} // gen_note()

	// add() main

	set_voices();			// initialize the voice parameters
	key_map(voice_tb[0].key)	// init accidental map from key sig.

	if (!a_e) {			// if first call
		a_e = []
		abc_time = rep_st_t = p_time = 0;
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

		if (s == rep_en_s) {			// repeat end
			s = rep_nx_s;
			abc_time = s.time
		}

		switch (s.type) {
		case BAR:
//fixme: handle different keys per staff
			if (s.v != 0)
				break

			// right repeat
			if (s.bar_type[0] == ':'
			 && s != rep_nx_s) {		// (already done)
				rep_nx_s = s		// repeat next
				if (!rep_en_s)		// if no "|1"
					rep_en_s = s	// repeat end
				if (rep_st_s) {		// if left repeat
					s = rep_st_s
					for (i = 0; i < 70; i++)
						map[i] = rep_st_map[i]
					for (i = 0; i < rep_st_transp.length; i++)
						transp[i] = rep_st_transp[i];
					play_factor = rep_st_fac;
				} else {			// back to start
					s = start;
					key_map(voice_tb[0].key);
					set_voices();
					bar_map()
				}
				abc_time = s.time
				break
			}

			if (!s.invis)
				bar_map()

			// left repeat
			if (s.bar_type[s.bar_type.length - 1] == ':') {
				rep_st_s = s;
				rep_en_s = null
				for (i = 0; i < 70; i++)
					rep_st_map[i] = map[i];
				rep_st_transp = []
				for (i = 0; i < transp.length; i++)
					rep_st_transp[i] = transp[i];
				rep_st_fac = play_factor
				break

			// 1st time repeat
			} else if (s.text && s.text[0] == '1') {
				rep_en_s = s
			}
			break
		case CLEF:
			transp[s.v] = (!s.clef_octave || s.clef_oct_transp) ?
					0 : s.clef_octave
			break
		case GRACE:
			if (s.time == 0		// if before beat at start time
			 && abc_time == 0) {
				dt = 0
				if (s.sappo)
					dt = BASE_LEN / 16
				else if (!s.next || s.next.type != NOTE)
					dt = d / 2;
				abc_time -= dt
			}
			gen_grace(s)
			break
		case KEY:
//fixme: handle different keys per staff
			if (s.v != 0)
				break
			key_map(s)
			break
		case REST:
		case NOTE:
			d = s.dur
			if (s.next && s.next.type == GRACE) {
				dt = 0
				if (s.next.sappo)
					dt = BASE_LEN / 16
				else if (!s.next.next || s.next.next.type != NOTE)
					dt = d / 2;
				s.next.time -= dt;
				d -= dt
			}
			if (s.type == NOTE)
				gen_notes(s, p_time, d / play_factor)
			break
		}
		s = s.ts_next
	}
    } // add()

} // ToAudio

// nodejs
if (typeof module == 'object' && typeof exports == 'object')
	exports.ToAudio = ToAudio
