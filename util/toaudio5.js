// toaudio5.js - audio output using HTML5 audio
//
// Copyright (C) 2015-2017 Jean-Francois Moine
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
//
// @i_onend: callback function called at end of playing
//		(no arguments)
// @sf: soundfont. Either an object {url, type}
//		or a string (URL, the type is forced to "js")
//	When the type is "js", the URL is the directory containing
//		the  <instrument>-ogg.js files of midi-js
//	When the type is "mp3" (I could not find "ogg" files)
//		the URL is the directory containing
//		the <instrument>-<type>. directories
// @i_onnote: callback function called on note start/stop playing
//	Arguments:
//		i: start index of the note in the ABC source
//		on: true on note start, false on note stop
function Audio5(i_onend, sf, i_onnote) {
	var	instr_tb = [
			"acoustic_grand_piano",
			"bright_acoustic_piano",
			"electric_grand_piano",
			"honky-tonk_piano",
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
			"fx_8_sci-fi",
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

		// note to name and note to octave
		nn =	["C", "Db", "D",  "Eb", "E",  "F",
			 "Gb", "G", "Ab", "A",  "Bb", "B"],
		no = "012345678"

	// -- global --
	var	onend = i_onend,	// callback function on play end
		ac,			// audio context
		gain,			// global gain
		gain_val = 0.7,
		a_e,			// event array
		onnote = i_onnote,	// callback function on note start/stop
		follow,			// follow the music

	// instruments/notes
		sfu =			// soundfont default URL
			"http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
		sft = "js",		// soundfont type:
					// - "js" midi-js with encoded data structure
					// - "mp3" midi-js mp3 samples
		sounds = [],		// [instr][mi] decoded notes per instrument
		w_instr = 0,		// number of instruments being loaded
		note_q = [],		// [instr, note] to be decoded
		w_note = 0,		// number of notes being decoded
		geval = eval,

	// -- play the memorized events --
		evt_idx,		// event index while playing
		iend,			// source stop index
		stime			// start playing time

	function decode_note(instr, mi) {

		// convert data URI to binary
		function data2bin(dataURI) {
			var	i,
				base64Index = dataURI.indexOf(',') + 1,
				base64 = dataURI.substring(base64Index),
				raw = window.atob(base64),
				rawl = raw.length,
				ab = new ArrayBuffer(rawl),
				array = new Uint8Array(ab)

			for (i = 0; i < rawl; i++)
				array[i] = raw.charCodeAt(i)
			return ab
		} // data2bin()

		function audio_dcod(snd) {
			ac.decodeAudioData(snd,
				function(b) {
					sounds[instr][mi] = b;
					w_note--
				},
				function(e) {
					alert("Decode audio data error " +
						(e ? e.err : "???"));
					w_note--;
					iend = 0
					if (onend)
						onend()
				})
		} // audio_dcod()

		// decode_note() main
		w_note++
		var p = nn[mi % 12] + no[(mi / 12) | 0]

		if (sft == 'js') {
			audio_dcod(data2bin(MIDI.Soundfont[instr_tb[instr]][p]))
		} else {
			var	url = sfu + '/' + instr_tb[instr] + '-' +
					sft + '/' + p + '.' + sft,
				req = new XMLHttpRequest();

			req.open('GET', url);
//// does not work with some browsers
//			req.responseType = 'arraybuffer';
//			req.onload = function() {
//				audio_dcod(this.response)
//			}
			req.overrideMimeType(
				"application/octet-stream; charset=x-user-defined");
			req.onload = function() {
				var	l = this.responseText.length,
					a = new ArrayBuffer(l),
					b = new Uint8Array(a)

				for (var i = 0; i < l; i++)
					b[i] = this.responseText.charCodeAt(i) & 0xff;
				audio_dcod(a)
			}
			req.onerror = function() {
				alert('Error while loading\n' + url);
				w_note--;
				iend = 0
				if (onend)
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
	function load_res() {
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
			mi = e[3]
			if (!sounds[instr][mi]) {	// if no note yet
				sounds[instr][mi] = true;
				note_q.push([instr, mi])
			}
		}
	}

	// play the next time sequence
	function play_next() {
		var	t, e, e2, maxt, o

		// play the next events
		e = a_e[evt_idx]
		if (!e
		 || e[0] > iend) {		// if source ref > source end
			if (onend)		// play end
				onend()
			return
		}
//fixme: better, count the number of events?
		maxt = e[1] + 3			// max time = evt time + 3 seconds
		do {
			o = ac.createBufferSource();
			o.buffer = sounds[e[2]][e[3]];
			o.connect(gain);
// if not a percussion instrument,
//  o.loop = true
//  o.loopStart = 3 // (for sample 4s)
			o.start(e[1] + stime, 0, e[4])

			if (follow && onnote) {
				var	st = (e[1] + stime - ac.currentTime) * 1000,
					i = e[0];
				setTimeout(onnote, st, i, true);
				setTimeout(onnote, st + e[4] * 1000, i, false)
			}

			t = e[1];		// event time
			e = a_e[++evt_idx]
		} while (e && e[1] <= maxt)

		setTimeout(play_next, (t + stime - ac.currentTime)
				* 1000 - 300)	// wake before end of playing
	} // play_next()

	// wait for all resources, then start playing
	function play_start() {
		if (iend == 0)		// play stop
			return

		// wait for instruments
		if (w_instr != 0) {
			setTimeout(function() {	// wait for all instruments
				play_start()
			}, 300)
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
			setTimeout(function() {	// wait for all notes
				play_start()
			}, 300)
			return
		}

		// all resources are there
		stime = ac.currentTime + .2;		// start time + 0.2s
		play_next()
	}

	// play the events
	Audio5.prototype.play = function(istart, i_iend, a_pe) {
		if (a_pe)			// force old playing events
			a_e = a_pe
		if (!a_e || !a_e.length) {
			if (onend)		// nothing to play
				onend()
			return
		}
		iend = i_iend;
		evt_idx = 0
		while (a_e[evt_idx] && a_e[evt_idx][0] < istart)
			evt_idx++
		if (!a_e[evt_idx]) {		// nothing to play
			if (onend)
				onend()
			return
		}
		load_res();
		play_start()
	} // play()

	// stop playing
	Audio5.prototype.stop = function() {
		iend = 0
	} // stop()

	// get soundfont type
	Audio5.prototype.get_sft = function() {
		return sft
	} // get_sft()

	// get soundfont URL
	Audio5.prototype.get_sfu = function() {
		return sfu
	} // get_sft()

	// get volume
	Audio5.prototype.get_vol = function() {
		if (gain)
			return gain.gain.value
		return gain_val
	} // get_vol()

	// set soundfont type
	Audio5.prototype.set_sft = function(v) {
		sft = v
	} // set_sft()

	// set soundfont URL
	Audio5.prototype.set_sfu = function(v) {
		sfu = v
	} // set_sft()

	// set volume
	Audio5.prototype.set_vol = function(v) {
		if (gain)
			gain.gain.value = v
		else
			gain_val = v
	} // set_vol()

	// set 'follow music'
	Audio5.prototype.set_follow = function(v) {
		follow = v
	} // set_follow()

	// Audio5 object creation
	if (!ac) {
		ac = new (window.AudioContext || window.webkitAudioContext);
		gain = ac.createGain();
		gain.gain.value = gain_val;
		gain.connect(ac.destination)
	}

	if (sf) {			// if soundfont
		if (typeof(sf) === 'object') {
			if (sf.url)
				sfu = sf.url
			if (sf.type)
				sft = sf.type
		} else {
			sfu = sf;
			sft = "js"
		}
	}

	if (typeof(MIDI) == "object")
		sounds[0] = []		// default: acoustic grand piano
	else
		MIDI = {}

} // end Audio5
