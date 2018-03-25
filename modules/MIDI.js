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

function MIDI(i_abc) {
    var	abc = i_abc

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
		}
	}
    } // set_midi()

// MIDI creation

	//export some functions/variables
	abc.tosvg('MIDI', '\
%%beginjs\n\
Abc.prototype.get_curvoice = function() { return curvoice }\n\
Abc.prototype.set_v_param = set_v_param\n\
Abc.prototype.syntax = syntax\n\
\
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

} //Grid()
