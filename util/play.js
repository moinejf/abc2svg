// play-1.js - file to include in html pages with abc2svg-1.js for playing
//
// Copyright (C) 2015-2018 Jean-Francois Moine
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

// This file is a wrapper around
// - ToAudio (toaudio.js - convert ABC to audio sequences)
// - Audio5 (toaudio5.js - play the audio sequences with webaudio and SF2)
// - Midi5 (tomidi5.js - play the audio sequences with webmidi)

// AbcPlay methods:
//
// get_outputs() - return an array of output devices
//
// set_output() - set the output type/port
//
// set_sfu() - get/set the soundfont URL
// @url: URL - undefined = return current value
//
// set_speed() - get/set the play speed
// @speed: < 1 slower, > 1 faster - undefined = return current value
//
// set_vol() - get/set the current sound volume
// @volume: range [0..1] - undefined = return current value

function AbcPlay(i_conf) {
    var	conf = i_conf,
	audio = ToAudio(),
	audio5, midi5, current,
	abcplay = {				// returned object (only instance)

		// get the output type/ports
		get_outputs: function() {
		    var o,
			outputs = []

			if (midi5) {
				o = midi5.get_outputs()
				if (o)
					outputs = o
			}
			if (audio5) {
				o = audio5.get_outputs()
				if (o)
					outputs = outputs.concat(o)
			}
			return outputs
		},
		set_output: set_output,
		clear: audio.clear,
		add: audio.add,
		set_sft: vf,
		set_sfu: function(v) {
			if (v == undefined)
				return conf.sfu
			conf.sfu = v
		},
		set_speed: function(v) {
			if (v == undefined)
				return conf.speed
			conf.new_speed = v
		},
		set_vol: function(v) {
			if (v == undefined)
				return conf.gain;
			conf.gain = v
			if (current && current.set_vol)
				current.set_vol(v)
		},
		play: play,
		stop: vf
	}

	function vf() {}			// void function

	// start playing when no defined output
	function play(istart, i_iend, a_e) {
	    var o,
		os = abcplay.get_outputs()
		if (os.length == 1) {
			o = 0
		} else {
			o = -1
			var res = window.prompt('Use \n0: ' + os[0] +
					'\n1: ' + os[1] + '?', '0')
			if (res) {
				o = Number(res)
				if (isNaN(o) || o < 0 || o >= os.length)
					o = -1
			}
			if (!res || o < 0) {
				if (conf.onend)
					conf.onend()
				return
			}
		}
		set_output(os[o]);
		abcplay.play(istart, i_iend, a_e)
	}

	// set the current output changing the play functions
	function set_output(name) {
		current = name == 'sf2' ? audio5 : midi5
		if (!current)
			return
		abcplay.play = current.play;
		abcplay.stop = current.stop
		if (current.set_output)
			current.set_output(name)
	} // set_output()

	// set default configuration values
	conf.gain = 0.7;
	conf.speed = 1;

	// get the play parameters from localStorage
	(function get_param() {
		try {
			if (!localStorage)
				return
		} catch (e) {
			return
		}
	    var	v = localStorage.getItem("sfu")
		if (v)
			conf.sfu = v;
		v = localStorage.getItem("volume")
		if (v)
			conf.gain = Number(v)
	})()

	// initialize the playing engines
	if (typeof Midi5 == "function")
		midi5 = Midi5(conf)
	if (typeof Audio5 == "function")
		audio5 = Audio5(conf);

	return abcplay
} // AbcPlay
