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
// 	sft: soundfont type ("js", "mp3" or "ogg")
//	sfu: soundfont URL
//		When the type is "js", the URL is the directory containing
//			the  <instrument>-ogg.js files of midi-js
//		When the type is "mp3" or "ogg",
//			the URL is the directory containing
//			the <instrument>-<type> directories
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
//		[2]: MIDI instrument
//		[3]: MIDI note pitch (with cents)
//		[4]: duration
//		[5]: volume (0..1 - optional)
//
// stop() - stop playing
//
// set_sft() - get/set the soundfont type
// @type: either "js", "mp3" or "ogg" - undefined = return current value
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

function Audio5(i_conf) {
	// constants
	var	instr_tb = [			// index = GM1 instrument - 1
			"acoustic_grand_piano",
			"bright_acoustic_piano",
			"electric_grand_piano",
			"honkytonk_piano",
			"electric_piano_1",
			"electric_piano_2",
			"harpsichord",
			"clavinet",
			"celesta",
			"glockenspiel",
			"music_box",
			"vibraphone",
			"marimba",
			"xylophone",
			"tubular_bells",
			"dulcimer",
			"drawbar_organ",
			"percussive_organ",
			"rock_organ",
			"church_organ",
			"reed_organ",
			"accordion",
			"harmonica",
			"tango_accordion",
			"acoustic_guitar_nylon",
			"acoustic_guitar_steel",
			"electric_guitar_jazz",
			"electric_guitar_clean",
			"electric_guitar_muted",
			"overdriven_guitar",
			"distortion_guitar",
			"guitar_harmonics",
			"acoustic_bass",
			"electric_bass_finger",
			"electric_bass_pick",
			"fretless_bass",
			"slap_bass_1",
			"slap_bass_2",
			"synth_bass_1",
			"synth_bass_2",
			"violin",
			"viola",
			"cello",
			"contrabass",
			"tremolo_strings",
			"pizzicato_strings",
			"orchestral_harp",
			"timpani",
			"string_ensemble_1",
			"string_ensemble_2",
			"synth_strings_1",
			"synth_strings_2",
			"choir_aahs",
			"voice_oohs",
			"synth_choir",
			"orchestra_hit",
			"trumpet",
			"trombone",
			"tuba",
			"muted_trumpet",
			"french_horn",
			"brass_section",
			"synth_brass_1",
			"synth_brass_2",
			"soprano_sax",
			"alto_sax",
			"tenor_sax",
			"baritone_sax",
			"oboe",
			"english_horn",
			"bassoon",
			"clarinet",
			"piccolo",
			"flute",
			"recorder",
			"pan_flute",
			"blown_bottle",
			"shakuhachi",
			"whistle",
			"ocarina",
			"lead_1_square",
			"lead_2_sawtooth",
			"lead_3_calliope",
			"lead_4_chiff",
			"lead_5_charang",
			"lead_6_voice",
			"lead_7_fifths",
			"lead_8_bass__lead",
			"pad_1_new_age",
			"pad_2_warm",
			"pad_3_polysynth",
			"pad_4_choir",
			"pad_5_bowed",
			"pad_6_metallic",
			"pad_7_halo",
			"pad_8_sweep",
			"fx_1_rain",
			"fx_2_soundtrack",
			"fx_3_crystal",
			"fx_4_atmosphere",
			"fx_5_brightness",
			"fx_6_goblins",
			"fx_7_echoes",
			"fx_8_scifi",
			"sitar",
			"banjo",
			"shamisen",
			"koto",
			"kalimba",
			"bagpipe",
			"fiddle",
			"shanai",
			"tinkle_bell",
			"agogo",
			"steel_drums",
			"woodblock",
			"taiko_drum",
			"melodic_tom",
			"synth_drum",
			"reverse_cymbal",
			"guitar_fret_noise",
			"breath_noise",
			"seashore",
			"bird_tweet",
			"telephone_ring",
			"helicopter",
			"applause",
			"gunshot"],

		// instruments
		loop = new Uint8Array([		// index = GM1 instrument - 1
			0, 0, 0, 0, 0, 0, 0, 0,		// 0   Piano
			0, 0, 0, 0, 0, 0, 0, 0,		// 8   Chromatic Percussion
			1, 1, 1, 1, 1, 1, 1, 1,		// 16  Organ
			0, 0, 0, 0, 0, 0, 0, 0,		// 24  Guitar
			0, 0, 0, 0, 0, 0, 0, 0,		// 32  Bass
			1, 1, 1, 1, 1, 0, 0, 0,		// 40  Strings
			1, 1, 1, 1, 1, 1, 1, 0,		// 48  Ensemble
			1, 1, 1, 1, 1, 1, 1, 1,		// 56  Brass
			1, 1, 1, 1, 1, 1, 1, 1,		// 64  Reed
			1, 1, 1, 1, 1, 1, 1, 1,		// 72  Pipe
			1, 1, 1, 1, 1, 1, 1, 1,		// 80  Synth Lead
			1, 1, 1, 1, 1, 1, 1, 1,		// 88  Synth Pad
			1, 1, 1, 1, 1, 1, 1, 1,		// 96  Synth Effects
			0, 0, 0, 0, 0, 1, 1, 1,		// 104 Ethnic
			0, 0, 0, 0, 0, 0, 0, 0,		// 112 Percussive
			0, 0, 0, 0, 0, 1, 1, 0		// 120 Sound Effects
		]),

		// note to name and note to octave
		nn =	["C", "Db", "D",  "Eb", "E",  "F",
			 "Gb", "G", "Ab", "A",  "Bb", "B"],
		no = "0012345678"

	// -- global --
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
		sft,			// soundfont type:
					// - "js" midi-js with encoded data structure
					// - "mp3" midi-js mp3 samples
					// - "ogg" midi-js ogg samples
		sdur,			// sample duration in the soundfont
		sounds = [],		// [instr][mi] decoded notes per instrument
		w_instr = 0,		// number of instruments being loaded
		note_q = [],		// [instr, note] to be decoded
		w_note = 0,		// number of notes being decoded
		geval = eval,

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
	function data2bin(URI) {
	    var	i, t,
		s = URI.substr(URI.indexOf(',') + 1),
		l = s.length,
		ab = new ArrayBuffer(l * 3 / 4),
		a = new Uint8Array(ab),
		j = 0

		for (i = 0; i < l; i += 4) {
			t =	(b64d[s[i]] << 18) +
				(b64d[s[i + 1]] << 12) +
				(b64d[s[i + 2]] << 6) +
				 b64d[s[i + 3]];
			a[j++] = (t >> 16) & 0xff;
			a[j++] = (t >> 8) & 0xff;
			a[j++] = t & 0xff
		}
		return ab
	}

	// get the URL and the type of the soundfont from cookies
	function get_cookies() {
	    var	ac = document.cookie.split(';')
		for (var i = 0; i < ac.length; i++) {
			var c = ac[i].split('=')
			switch (c[0].replace(/ */, '')) {
			case "follow":
				follow = c[1] == "true"
				break
			case "sft":
				if (!sft)
					sft = c[1]
				break
			case "sfu":
				if (!sfu)
					sfu = c[1]
				break
//			case "speed":
//			    var	v = Math.pow(3, (c[1] - 10) * .1);
//				speed = v
//				break
			case "volume":
				vol = Number(c[1])
				break
			}
		}
	}

	function decode_note(instr, mi) {

		function audio_dcod(instr, mi, snd) {
			ac.decodeAudioData(snd,
				function(b) {
					sounds[instr][mi] = b;
					w_note--

					// get the duration of the samples
					if (!sdur)
						sdur = b.duration
				},
				function(e) {
					alert("Decode audio data error " +
						(e ? e.err : "???"));
					w_note--;
					iend = 0;
					onend()
				})
		} // audio_dcod()

		// decode_note() main
		w_note++
		var p = nn[mi % 12] + no[(mi / 12) | 0]

		if (sft == 'js') {
			audio_dcod(instr, mi,
				data2bin(MIDI.Soundfont[instr_tb[instr]][p]))
		} else {
			var	url = sfu + '/' + instr_tb[instr] + '-' +
					sft + '/' + p + '.' + sft,
				req = new XMLHttpRequest();

			req.open('GET', url);
			req.responseType = 'arraybuffer';
			req.onload = function() {
				audio_dcod(instr, mi, this.response)
			}
			req.onerror = function(msg) {
				if (typeof msg == 'object')
					msg = msg.type
				alert("Error '" + msg + "' while loading\n" + url);
				w_note--;
				iend = 0;
				onend()
			}
			req.send()
		}
	} // decode_note()

	// load an instrument (.js file)
	function load_instr(instr) {
		if (sft != 'js')
			return
		w_instr++
		var	url = sfu + '/' + instr_tb[instr] + '-ogg.js',
			script = document.createElement('script');
		script.src = url;
		script.onload = function() {
			w_instr--
		}
		document.head.appendChild(script)
	} // load_instr()

	// start loading the required MIDI resources
	function load_res(a_e) {
		var i, e, instr, mi

		for (i = evt_idx; ; i++) {
			e = a_e[i]
			if (!e || e[0] > iend)
				break
			instr = e[2]
			if (!sounds[instr]) {
				sounds[instr] = [];
				load_instr(instr)
			}
			mi = e[3] | 0
			if (!sounds[instr][mi]) {	// if no note yet
				sounds[instr][mi] = true;
				note_q.push([instr, mi])
			}
		}
	}

	// play the next time sequence
	function play_next(a_e) {
		var	t, e, e2, maxt, o, st, d;

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
		    if (e[5] != 0) {		// if not a rest
			o = ac.createBufferSource();
			o.buffer = sounds[e[2]][e[3] | 0];
			o.connect(gain)
			if (o.detune) {
				d = (e[3] * 100) % 100
				if (d)			// if micro-tone
					 o.detune.value = d
			}
			d = e[4] / speed
			if (d > sdur && loop[e[2]]) {	// if not a percussion instrument
				o.loop = true;
				o.loopStart = 1 + Math.random() * .2;
				o.loopEnd = sdur - Math.random() * .2
			}
			st = t + stime;			// absolute start time
//			o.start(st, 0, d)	// (does not work in firefox when loop)
			o.start(st);
			o.stop(st + d)
		    } else {
			d = e[4] / speed		// (rest)
		    }

			if (follow) {
			    var	i = e[0];
				st = (st - ac.currentTime) * 1000;
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

		// wait for notes
		if (note_q.length != 0) {
			while (1) {
				var e = note_q.shift()
				if (!e)
					break
				decode_note(e[0], e[1])
			}
		}
		if (w_note != 0) {
			timout = setTimeout(play_start, 300, a_e)
			return
		}

		// all resources are there
		gain.connect(ac.destination);
		stime = ac.currentTime + .2		// start time + 0.2s
			- a_e[evt_idx][1] * speed;
		play_next(a_e)
	} // play_start()

	function set_cookie(n, v) {
	    var	d = new Date();
		d.setTime(d.getTime() + 31536000000)	// one year
//					365 * 24 * 60 * 60 * 1000
		document.cookie = n + "=" + v + ";expires=" + d.toUTCString()
	}

// Audio5 object creation

	// initialize base64 decoding
	init_b64d()

	// get the soundfont
	// 1- from the object configuration
	if (conf.sft)
		sft = conf.sft
	if (conf.sfu)
		sfu = conf.sfu
	// 2- from cookies
	if (!sfu || !sft)
		get_cookies()
	// 3- from the site location
	if (!sfu || !sft) {
		if (document.URL.match(/^http:\/\/moinejf.free.fr/)) {
			if (!sfu)
				sfu = "http://moinejf.free.fr/js/FluidR3_GM"
			if (!sft)
				sft = "ogg"
		} else {
			if (!sfu)
			    sfu =
				"https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM"
			if (!sft)
				sft = "js"
		}
	}

	if (conf.onend)
		onend = conf.onend
	if (conf.onnote)
		onnote = conf.onnote

	if (typeof(MIDI) == "object")
		sounds[0] = []		// default: acoustic grand piano
	else
		MIDI = {}

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
		set_cookie("follow", v)
	}, // set_follow()

	// set soundfont type
	set_sft: function(v) {
		if (v == undefined)
			return sft
		sft = v;
		set_cookie("sft", v)
	}, // set_sft()
	get_sft: this.set_sft,	// compatibility

	// set soundfont URL
	set_sfu: function(v) {
		if (v == undefined)
			return sfu
		sfu = v;
		set_cookie("sfu", v)
	}, // set_sft()
	get_sfu: this.set_sfu,	// compatibility

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
		set_cookie("volume", v.toFixed(2))
	}, // set_vol()
	get_vol: this.set_vol	// compatibility
    }
} // end Audio5
