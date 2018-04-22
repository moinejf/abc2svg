// MIDI.js - module to handle the %%MIDI parameters
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%MIDI" appears in a ABC source.
//
// Parameters (see abcMIDI for details)
//	%%MIDI channel n
//	%%MIDI program n
//	%%MIDI control k v
//	%%MIDI drummap ABC_note MIDI_pitch

function MIDI(i_abc) {
    var	abc = i_abc,
	pits = new Int8Array([0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6]),
	accs = new Int8Array([0, 1, 0, -1, 0, 0, 1, 0, -1, 0, -1, 0])

    // convert a MIDI pitch to a note
    function tonote(p) {
    var	pit = Number(p)
	if (isNaN(pit))
		return
	p = ((pit / 12) | 0) * 7 - 19;	// octave
	pit = pit % 12;			// in octave
	p += pits[pit]
	note = {
		pit: p,
		apit: p,
	}
	if (accs[pit])
		note.acc = accs[pit]
	return note
    }

    // normalize a note for mapping
    function norm(p) {
    var	a = p.match(/^([_^]*)([A-Ga-g])([,']*)$/)	// '
	if (!a) {
		abc.syntax()
		return
	}
	if (p.match(/[A-Z]/)) {
		p = p.toLowerCase();
		if (p.indexOf("'") > 0)
			p = p.replace("'", '')
		else
			p += ','
	}
	return p
    }

    // parse %%MIDI commands
    MIDI.prototype.do_midi = function(parm) {
	var	n, v,
		a = parm.split(/\s+/)

	switch (a[1]) {
	case "channel":
		if (a[2] != "10")
			break
		abc.set_v_param("midictl", "0 1") // channel 10 is bank 128 program 0
		break
	case "drummap":
		if (abc.get_cfmt("sound") != "play")
			break
//fixme: should have a 'MIDIdrum' per voice?
		n = norm(a[2]);
		v = tonote(a[3]);
		if (!n || !v) {
			abc.syntax(1, abc.err_bad_val_s, "%%MIDI drummap")
			break
		}
		if (!abc.maps.MIDIdrum)
			abc.maps.MIDIdrum = {}
		abc.maps.MIDIdrum[n] = [null, v];
		abc.set_v_param("mididrum", "MIDIdrum")
		break
	case "program":
		if (a[3] != undefined)	// the channel is unused
			v = a[3]
		else
			v = a[2];
		v = parseInt(v)
		if (isNaN(v) || v < 0 || v > 127) {
			abc.syntax(1, "Bad program in %%MIDI")
			return
		}
		abc.set_v_param("instr", v)
		break
	case "control":
		n = parseInt(a[2])
		if (isNaN(n) || n < 0 || n > 127) {
			abc.syntax(1, "Bad controller number in %%MIDI")
			return
		}
		v = parseInt(a[3])
		if (isNaN(v) || v < 0 || v > 127) {
			abc.syntax(1, "Bad controller value in %%MIDI")
			return
		}
		abc.set_v_param("midictl", a[2] + ' ' + a[3])
		break
	}
    } // do_midi()

    // set the MIDI parameters in the current voice
    MIDI.prototype.set_midi = function(a) {
    var	i, item,
	curvoice = abc.get_curvoice()

	for (i = 0; i < a.length; i++) {
		switch (a[i]) {
		case "instr=":			// %%MIDI program
			curvoice.instr = a[i + 1]
			break
		case "midictl=":		// %%MIDI control
			if (!curvoice.midictl)
				curvoice.midictl = {}
			item = a[i + 1].split(' ');
			curvoice.midictl[item[0]] = Number(item[1])
			break
		case "mididrum=":		// %%MIDI drummap note midipitch
			if (!curvoice.map)
				curvoice.map = {}
			curvoice.map = a[i + 1]
			break
		}
	}
    } // set_midi()

// MIDI creation

	//export some functions/variables
	abc.tosvg('MIDI', '\
%%beginjs\n\
var midi = {\n\
	psc: do_pscom,\n\
	svp: set_vp\n\
}\n\
do_pscom = function(text) {\n\
	if (text.slice(0, 5) == "MIDI ")\n\
		MIDI.prototype.do_midi(text)\n\
	else\n\
		midi.psc(text)\n\
}\n\
set_vp = function(a) {\n\
	MIDI.prototype.set_midi(a);\n\
	midi.svp(a)\n\
}\n\
%%endjs\n\
')

} //MIDI()
