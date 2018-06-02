// tomidi5.js - audio output using HTML5 MIDI
//
// Copyright (C) 2018 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// Midi5 creation
// one argument:
// @conf: configuration object - all items are optional:
//	onend: callback function called at end of playing
//		(no arguments)
//	onnote: callback function called on note start/stop playing
//		Arguments:
//			i: start index of the note in the ABC source
//			on: true on note start, false on note stop

// Midi5 methods

// get_outputs() - get the output ports
//
// set_output() - set the output port
//
// play() - start playing
// @start_index -
// @stop_index: play the notes found in ABC source between
//		the start and stop indexes
// @play_event: optional (default: previous generated events)
//	array of array
//		[0]: index of the note in the ABC source
//		[1]: time in seconds
//		[2]: MIDI instrument (MIDI GM number - 1)
//		[3]: MIDI note pitch (with cents)
//		[4]: duration
//		[5]: volume (0..1 - optional)
//
// stop() - stop playing

function Midi5(i_conf) {
    var	conf = i_conf,		// configuration
	onend = conf.onend || function() {},
	onnote = conf.onnote || function() {},

// MIDI variables
	op,			// output port
	instr,			// instrument -> channel
	ch,			// channel allocation

// -- play the memorized events --
	evt_idx,		// event index while playing
	iend,			// source stop index
	stime			// start playing time in ms

// create a note
// @e[2] = instrument index
// @e[3] = MIDI key + detune
// @t = audio start time (ms)
// @d = duration adjusted for speed (ms)
    function note_run(e, t, d) {
    var	k = e[3] | 0,
	i = e[2],
	c = instr[i]

	if (c == undefined) {
		c = ch++;
		instr[i] = c;
		op.send(new Uint8Array([
				0xb0 + c, 0, (i >> 14) & 0x7f,	// MSB bank
				0xb0 + c, 32, (i >> 7) & 0x7f,	// LSB bank
				0xc0 + c, i & 0x7f		// program
			]))
	}
	op.send(new Uint8Array([0x90 + c, k, 127]), t);		// note on
	op.send(new Uint8Array([0x80 + c, k, 0x40]), t + d - 20) // note off
    } // note_run()

// play the next time sequence
    function play_next(a_e) {
    var	t, e, e2, maxt, st, d

	// play the next events
	if (!op) {
		onend()
		return
	}
			
	e = a_e[evt_idx]
	if (!e
	 || e[0] > iend) {		// if source ref > source end
		onend()
		return
	}

	// if speed change, shift the start time
	if (conf.new_speed) {
		stime = window-performance.now() -
				(window.performance.now() - stime) *
					conf.speed / conf.new_speed;
		conf.speed = conf.new_speed;
		conf.new_speed = 0
	}

	t = e[1] / conf.speed * 1000;	// start time
	maxt = t + 3000			// max time = evt time + 3 seconds
	while (1) {
		d = e[4] / conf.speed * 1000
		if (e[5] != 0)		// if not a rest
			note_run(e, t + stime, d)

		// follow the notes while playing
			st = t + stime - window.performance.now();
			setTimeout(onnote, st, e[0], true);
			setTimeout(onnote, st + d, e[0], false)

		e = a_e[++evt_idx]
		if (!e) {
			setTimeout(onend,
				t + stime - window.performance.now() + d)
			return
		}
		t = e[1] / conf.speed * 1000
		if (t > maxt)
			break
	}

	// delay before next sound generation
	setTimeout(play_next, (t + stime - window.performance.now())
			- 300,		// wake before end of playing
			a_e)
    } // play_next()

// Midi5 object creation (only one instance)

// public methods
    return {

	// get outputs
	get_outputs: function() {
//fixme: just the first output port for now...
		if (Midi5.ma)
			op = Midi5.ma.outputs.values().next().value
			if (op)
				return [op.name]
	}, // get_outputs()

	// set the output port
	set_output: function(name) {
//fixme: todo
//		if (!Midi5.ma)
//			return
	},

	// play the events
	play: function(istart, i_iend, a_e) {
		if (!a_e || !a_e.length) {
			onend()			// nothing to play
			return
		}
		iend = i_iend;
		evt_idx = 0
		while (a_e[evt_idx] && a_e[evt_idx][0] < istart)
			evt_idx++
		if (!a_e[evt_idx]) {
			onend()			// nothing to play
			return
		}

		stime = window.performance.now() + 200	// start time + 0.2s
			- a_e[evt_idx][1] * conf.speed * 1000;
		instr = [];
		ch = 0;
		play_next(a_e)
	}, // play()

	// stop playing
	stop: function() {
		iend = 0
//fixme: op.clear() should exist...
		if (op && op.clear)
			op.clear()
	} // stop()
    }
} // end Midi5

// check MIDI access at script load time
function onMIDISuccess(access) {
	Midi5.ma = access	// store the MIDI access in the Midi5 function
} // onMIDISuccess()

function onMIDIFailure(msg) {
} // onMIDIFailure()

if (navigator.requestMIDIAccess)
	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
