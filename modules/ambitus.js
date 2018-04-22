// ambitus.js - module to insert an ambitus at start of a voice
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%ambitus" appears in a ABC source.
//
// Parameters
//	%%ambitus 1

abc2svg.ambitus = {
    do_ambitus: function(voice_tb) {

// constants from the abc2svg core
    var	BASE_LEN = 1536,
	NOTE = 8,
	FULL = 0
    var	s, v, p_v, min, max

	for (v = 0; v < voice_tb.length; v++) {
		p_v = voice_tb[v];
		min = 100;
		max = -100

		// search the top and bottom pitches
		for (s = p_v.sym; s; s = s.next) {
			if (s.type != NOTE)
				continue
			if (s.notes[s.nhd].pit > max)
				max = s.notes[s.nhd].pit
			if (s.notes[0].pit < min)
				min = s.notes[0].pit
		}
		if (min == 100)
			continue			// no note

		s = p_v.clef;
		s.stem = 1;
		s.head = FULL;
		s.stemless = true;
		s.nhd = 1;
		s.notes = [{
				dur: BASE_LEN / 4,
				pit: min,
				shhd: 0
			},{
				dur: BASE_LEN / 4,
				pit: max,
				shhd: 0
			}]
	}
    } // do_ambitus()
} // ambitus

// inject code inside the core
abc2svg.inject += '\
var ambitus = {\n\
	ds: draw_symbols,\n\
	om: output_music,\n\
	set_fmt: set_format,\n\
	set_w: set_width\n\
}\n\
draw_symbols = function(p_voice) {\n\
    var	d, s = p_voice.sym\n\
	if (s.type == CLEF && s.nhd > 0) {\n\
		d = delta_tb[s.clef_type] + s.clef_line * 2;\n\
		s.notes[0].pit += d;\n\
		s.notes[1].pit += d;\n\
		s.x -= 26;\n\
		draw_note(s);\n\
		if (s.notes[1].pit - s.notes[0].pit > 4) {\n\
			xypath(s.x, 3 * (s.notes[1].pit - 18) + staff_tb[s.st].y);\n\
			output.push("v" +\n\
				((s.notes[1].pit - s.notes[0].pit) * 3).toFixed(2) +\n\
				\'" stroke-width=".6"/>\\\n\');\n\
		}\n\
		s.x += 26;\n\
		p_voice.clef.nhd = 0\n\
	}\n\
	ambitus.ds(p_voice)\n\
}\n\
output_music = function() {\n\
	if (cfmt.ambitus)\n\
		abc2svg.ambitus.do_ambitus(voice_tb)\n\
	ambitus.om()\n\
}\n\
set_format = function(cmd, param, lock) {\n\
	if (cmd == "ambitus") {\n\
		cfmt.ambitus = param\n\
		return\n\
	}\n\
	ambitus.set_fmt(cmd, param, lock)\n\
}\n\
set_width = function(s) {\n\
	if (s.type == CLEF && s.nhd > 0) {\n\
		s.wl = 40;\n\
		s.wr = 12\n\
	} else {\n\
		ambitus.set_w(s)\n\
	}\n\
}\n\
'
