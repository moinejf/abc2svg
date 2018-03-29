// toaudio5.js - audio output using HTML5 audio
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

// Audio5 creation
// one argument:
// @conf: configuration object - all items are optional:
//	ac: audio context
//	sfu: soundfont URL (sf2 base64 encoded)
//	onend: callback function called at end of playing
//		(no arguments)
//	onnote: callback function called on note start/stop playing
//		Arguments:
//			i: start index of the note in the ABC source
//			on: true on note start, false on note stop

// Audio5 methods

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
//
// set_sfu() - get/set the soundfont URL
// @url: URL - undefined = return current value
//
// set_speed() - get/set the play speed
// @speed: < 1 slower, > 1 faster - undefined = return current value
//
// set_vol() - get/set the current sound volume
// @volume: range [0..1] - undefined = return current value
//
// set_follow() - get/set the flag to call or not the 'onnote' callback
// @follow: boolean - undefined = return current value

    var	abcsf2 = []

function Audio5(i_conf) {

	var	conf = i_conf,		// configuration
		onend = function() {},	// callback function on play end
		onnote = function() {},	// callback function on note start/stop
		ac,			// audio context
		gain,			// global gain
		gain_val = 0.7,
		timout,			// timer while playing
		follow = true,		// follow the music
		speed = 1,		// speed factor
		new_speed,

	// instruments/notes
		sfu,			// soundfont URL
		params = [],		// [instr][key] note parameters per instrument
		rates = [],		// [instr][key] playback rates
		w_instr = 0,		// number of instruments being loaded

	// -- play the memorized events --
		evt_idx,		// event index while playing
		iend,			// source stop index
		stime			// start playing time

	// base64 stuff
	    var b64d = []
	function init_b64d() {
	    var	b64l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
		l = b64l.length
		for (var i = 0; i < l; i++)
			b64d[b64l[i]] = i
		b64d['='] = 0
	}
	function b64dcod(s) {
	    var	i, t, dl, a,
		l = s.length,
		j = 0

		dl = l * 3 / 4			// destination length
		if (s[l - 1] == '=') {
			if (s[l - 2] == '=')
				dl--;
			dl--;
			l -= 4
		}
		a = new Uint8Array(dl)
		for (i = 0; i < l; i += 4) {
			t =	(b64d[s[i]] << 18) +
				(b64d[s[i + 1]] << 12) +
				(b64d[s[i + 2]] << 6) +
				 b64d[s[i + 3]];
			a[j++] = (t >> 16) & 0xff;
			a[j++] = (t >> 8) & 0xff;
			a[j++] = t & 0xff
		}
		if (l != s.length) {
			t =	(b64d[s[i]] << 18) +
				(b64d[s[i + 1]] << 12) +
				(b64d[s[i + 2]] << 6) +
				 b64d[s[i + 3]];
			a[j++] = (t >> 16) & 0xff
			if (j < dl)
				a[j++] = (t >> 8) & 0xff
		}
		return a
	}

	// get the play parameters from localStorage
	function get_param() {
	    var	v = localStorage.getItem("follow")
		if (v)
			follow = v != "0";
		v = localStorage.getItem("sfu")
		if (v)
			sfu = v;
		v = localStorage.getItem("volume")
		if (v)
			gain_val = Number(v)
	}

	// copy a sf2 sample to an audio buffer
	// @b = audio buffer (array of [-1..1])
	// @s = sf2 sample (PCM 16 bits)
	function sample_cp(b, s) {
	    var	i, n,
		a = b.getChannelData(0)		// destination = array of float32

		for (i = 0; i < s.length; i++)
			a[i] = s[i] / 196608	// volume divided by 6
	}

	// create all notes of an instrument
	function sf2_create(parser, instr) {
	    var i, sid, gen, parm, sampleRate, sample,
		infos = parser.getInstruments()[0].info;

		rates[instr] = []
		for (i = 0; i < infos.length; i++) {
			gen = infos[i].generator;
			if (!gen.sampleID)	// (empty generator!)
				continue
			sid = gen.sampleID.amount;
			sampleRate = parser.sampleHeader[sid].sampleRate;
			sample = parser.sample[sid];
			parm = {
				attack: Math.pow(2, (gen.attackVolEnv ?
					gen.attackVolEnv.amount : -12000) / 1200),
				hold: Math.pow(2, (gen.holdVolEnv ?
					gen.holdVolEnv.amount : -12000) / 1200),
				decay: Math.pow(2, (gen.decayVolEnv ?
					gen.decayVolEnv.amount : -12000) / 1200) / 3,
				sustain: gen.sustainVolEnv ?
					(gen.sustainVolEnv.amount / 1000) : 0,
//				release: Math.pow(2, (gen.releaseVolEnv ?
//					gen.releaseVolEnv.amount : -12000) / 1200),
				buffer: ac.createBuffer(1,
							sample.length,
							sampleRate)
			}
			parm.hold += parm.attack;
			parm.decay += parm.hold;

			// sustain > 40dB is not audible
			if (parm.sustain >= .4)
				parm.sustain = 0.01	// must not be null
			else
				parm.sustain = 1 - parm.sustain / .4

			sample_cp(parm.buffer, sample)

			if (gen.sampleModes && (gen.sampleModes.amount & 1)) {
				parm.loopStart = parser.sampleHeader[sid].startLoop /
					sampleRate;
				parm.loopEnd = parser.sampleHeader[sid].endLoop /
					sampleRate
			}

			// define the notes
		    var scale = (gen.scaleTuning ?
					gen.scaleTuning.amount : 100) / 100,
			tune = (gen.coarseTune ? gen.coarseTune.amount : 0) +
				(gen.fineTune ? gen.fineTune.amount : 0) / 100 +
				parser.sampleHeader[sid].pitchCorrection / 100 -
				(gen.overridingRootKey ?
					gen.overridingRootKey.amount :
					parser.sampleHeader[sid].originalPitch)

			for (j = gen.keyRange.lo; j <= gen.keyRange.hi; j++) {
				rates[instr][j] = Math.pow(Math.pow(2, 1 / 12),
							(j + tune) * scale);
				params[instr][j] = parm
			}
		}
	} // sf2_create()

	// load an instrument (.js file)
	function load_instr(instr) {
		w_instr++;
		loadjs(sfu + '/' + instr + '.js',
			function() {
			    var	parser = new sf2.Parser(b64dcod(abcsf2[instr]));
				parser.parse();
				sf2_create(parser, instr);
				w_instr--
			})
	} // load_instr()

	// start loading the instruments
	function load_res(a_e) {
		var i, e, instr

		for (i = evt_idx; ; i++) {
			e = a_e[i]
			if (!e || e[0] > iend)
				break
			instr = e[2]
			if (!params[instr]) {
				params[instr] = [];
				load_instr(instr)
			}
		}
	}

	// create a note
	// @e[2] = instrument index
	// @e[3] = MIDI key + detune
	// @t = audio start time
	// @d = duration adjusted for speed
	function note_run(e, t, d) {
	    var	g, st,
		instr = e[2],
		key = e[3] | 0,
		parm = params[instr][key],
		o = ac.createBufferSource();

		o.buffer = parm.buffer
		if (parm.loopStart) {
			o.loop = true;
			o.loopStart = parm.loopStart;
			o.loopEnd = parm.loopEnd;
		}
		if (o.detune) {
		    var	dt = (e[3] * 100) % 100
			if (dt)			// if micro-tone
				 o.detune.value = dt
		}
//		o.playbackRate.setValueAtTime(parm.rate, ac.currentTime);
		o.playbackRate.value = rates[instr][key];

		g = ac.createGain();
		if (parm.hold < 0.002) {
			g.gain.setValueAtTime(1, t)
		} else {
			if (parm.attack < 0.002) {
				g.gain.setValueAtTime(1, t)
			} else {
				g.gain.setValueAtTime(0, t);
				g.gain.linearRampToValueAtTime(1, t + parm.attack)
			}
			g.gain.setValueAtTime(1, t + parm.hold)
		}

		g.gain.exponentialRampToValueAtTime(parm.sustain,
					t + parm.decay);

		o.connect(g);
		g.connect(gain);

		// start the note
		o.start(t);
		o.stop(t + d)
	} // note_run()

	// play the next time sequence
	function play_next(a_e) {
		var	t, e, e2, maxt, st, d;

		// play the next events
		e = a_e[evt_idx]
		if (!e
		 || e[0] > iend) {		// if source ref > source end
			onend()
			return
		}

		// if speed change, shift the start time
		if (new_speed) {
			stime = ac.currentTime -
					(ac.currentTime - stime) * speed / new_speed;
			speed = new_speed;
			new_speed = 0
		}

//fixme: better, count the number of events?
		t = e[1] / speed;		// start time
		maxt = t + 3			// max time = evt time + 3 seconds
		while (1) {
			d = e[4] / speed
			if (e[5] != 0)		// if not a rest
				note_run(e, t + stime, d)

			if (follow) {
			    var	i = e[0];

				st = (t + stime - ac.currentTime) * 1000;
				setTimeout(onnote, st, i, true);
				setTimeout(onnote, st + d * 1000, i, false)
			}

			e = a_e[++evt_idx]
			if (!e) {
				setTimeout(onend,
					(t + stime - ac.currentTime + d) * 1000)
				return
			}
			t = e[1] / speed
			if (t > maxt)
				break
		}

		// delay before next sound generation
		timout = setTimeout(play_next, (t + stime - ac.currentTime)
				* 1000 - 300,	// wake before end of playing
				a_e)
	} // play_next()

	// wait for all resources, then start playing
	function play_start(a_e) {
		if (iend == 0)		// play stop
			return

		// wait for instruments
		if (w_instr != 0) {
			timout = setTimeout(play_start, 300, a_e)
			return
		}

		// all resources are there
		gain.connect(ac.destination);
		stime = ac.currentTime + .2		// start time + 0.2s
			- a_e[evt_idx][1] * speed;
		play_next(a_e)
	} // play_start()

// Audio5 object creation

	init_b64d();			// initialize base64 decoding

	get_param()			// get the play parameters

	if (!sfu)
		sfu = "Scc1t2"		// set the default soundfont location

	if (conf.onend)
		onend = conf.onend
	if (conf.onnote)
		onnote = conf.onnote

    // external methods
    return {

	// play the events
	play: function(istart, i_iend, a_e) {
		if (!a_e || !a_e.length) {
			onend()			// nothing to play
			return
		}

		// initialize the audio subsystem if not done yet
		// (needed for iPhone/iPad/...)
		if (!gain) {
			ac = conf.ac
			if (!ac)
				conf.ac = ac = new (window.AudioContext ||
							window.webkitAudioContext);
			gain = ac.createGain();
			gain.gain.value = gain_val
		}

		iend = i_iend;
		evt_idx = 0
		while (a_e[evt_idx] && a_e[evt_idx][0] < istart)
			evt_idx++
		if (!a_e[evt_idx]) {
			onend()			// nothing to play
			return
		}
		load_res(a_e);
		play_start(a_e)
	}, // play()

	// stop playing
	stop: function() {
		clearTimeout(timout);
		onend();
		iend = 0
		if (gain) {
			gain.disconnect();
			gain = null
		}
	}, // stop()

	// get/set 'follow music'
	set_follow: function(v) {
		if (v == undefined)
			return follow
		follow = v;
	}, // set_follow()

	// set soundfont URL
	set_sfu: function(v) {
		if (v == undefined)
			return sfu
		sfu = v;
	}, // set_sfu()

	// set speed (< 1 slower, > 1 faster)
	set_speed: function(v) {
		if (v == undefined)
			return speed
		new_speed = v
	}, // set_speed()

	// set volume
	set_vol: function(v) {
		if (v == undefined) {
			if (gain)
				return gain.gain.value
			return gain_val
		}
		if (gain)
			gain.gain.value = v
		else
			gain_val = v;
	} // set_vol()
    }
} // end Audio5
