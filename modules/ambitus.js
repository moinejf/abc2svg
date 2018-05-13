// ambitus.js - module to insert an ambitus at start of a voice
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%ambitus" appears in a ABC source.
//
// Parameters
//	%%ambitus 1

abc2svg.ambitus = {
    do_ambitus: function() {

// constants from the abc2svg core
    var	BASE_LEN = 1536,
	NOTE = 8,
	FULL = 0
    var	s, v, p_v, min, max,
	voice_tb = this.get_voice_tb()

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
    }, // do_ambitus()

    draw_symbols: function(of, p_voice) {
// constants from the abc2svg core
    var	d,
	delta_tb = this.get_delta_tb(),
	staff_tb = this.get_staff_tb(),
	s = p_voice.sym

	if (s.clef_type != undefined && s.nhd > 0) {
		d = delta_tb[s.clef_type] + s.clef_line * 2;
		s.notes[0].pit += d;
		s.notes[1].pit += d;
		s.x -= 26;
		this.draw_note(s)
		if (s.notes[1].pit - s.notes[0].pit > 4) {
			this.xypath(s.x, 3 * (s.notes[1].pit - 18) + staff_tb[s.st].y);
			this.out_svg('v' +
				((s.notes[1].pit - s.notes[0].pit) * 3).toFixed(2) +
				'" stroke-width=".6"/>\n');
		}
		s.x += 26;
		p_voice.clef.nhd = 0
	}
	of(p_voice)
    }, // draw_symbols()

    output_music: function(of) {
	if (this.cfmt().ambitus)
		abc2svg.ambitus.do_ambitus.call(this)
	of()
    },

    set_fmt: function(of, cmd, param, lock) {
	if (cmd == "ambitus") {
		this.cfmt().ambitus = param
		return
	}
	of(cmd, param, lock)
    },

    set_width: function(of, s) {
	if (s.clef_type != undefined && s.nhd > 0) {
		s.wl = 40;
		s.wr = 12
	} else {
		of(s)
	}
    }
} // ambitus

abc2svg.modules.hooks.push(
// export
	"draw_note",
// hooks
	[ "draw_symbols", "abc2svg.ambitus.draw_symbols" ],
	[ "output_music", "abc2svg.ambitus.output_music" ],
	[ "set_format", "abc2svg.ambitus.set_fmt" ],
	[ "set_width", "abc2svg.ambitus.set_width" ]
)

// the module is loaded
abc2svg.modules.ambitus.loaded = true
