// sth.js - module to set the stem heights
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%sth" appears in a ABC source.
//
// Parameters
//	%%sth h1 h2 h3 ...
// The values h1, h2, .. are applied to the following notes which
// have a stem and which are not inside a beam.
// The value may be '*' for keeping the original stem length.

abc2svg.sth = {

// function called after beam calculation
    recal_beam: function(bm, s) {
    var staff_tb = this.get_staff_tb(),
	st = s.st,
	s2 = bm.s2
	if (s.sth)
		s.ys = s.sth
	if (s2.sth)
		s2.ys = s2.sth;
	bm.a = (s.ys- s2.ys) / (s.xs - s2.xs);
	bm.b = s.ys - s.xs * bm.a + staff_tb[st].y
	while (1) {
		s.ys = bm.a * s.xs + bm.b - staff_tb[st].y
		if (s.stem > 0)
			s.ymx = s.ys + 2.5
		else
			s.ymn = s.ys - 2.5;
		s = s.next
		if (s == s2)
			break
	}
    },

// function called after the stem heights have been computed
    set_sth: function() {
    var s, h, v, sth_a, p_voice,
	voice_tb = this.get_voice_tb()

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.sth != null)	// if no stem length in this voice
			continue
		sth_a = []
		for (s = p_voice.sym; s; s = s.next) {
			if (s.sth) {
				sth_a = s.sth;
				s.sth = null
			}
			if (sth_a.length == 0
			 || s.nflags <= -2 || s.stemless
			 || !(s.beam_st || s.beam_end))
				continue
			h = sth_a.shift()
			if (h == '*')
				continue	// no change
			if (h == '|') {		// skip to the next measure bar
				for (s = s.next; s; s = s.next) {
					if (s.bar_type)
						break
				}
				continue
			}
			h = Number(h)
			if (isNaN(h) || !h)
				continue	// fixme: error
			if (s.stem >= 0) {
				s.ys = s.y + h;
				s.ymx = (s.ys + 2.5) | 0
			} else {
				s.ys = s.y - h;
				s.ymn = (s.ys - 2.5) | 0
			}
			s.sth = s.ys
		}
	}
    }, // set_sth()

    calculate_beam: function(of, bm, s1) {
    var	done = of(bm, s1)
	if (done && bm.s2 && s1.sth)
		abc2svg.sth.recal_beam.call(this, bm, s1)
	return done
    },

    new_note: function(of, grace, tp_fact) {
    var	NOTE = 8		// constant from the abc2svg core
    var	s = of(grace, tp_fact),
	curvoice = this.get_curvoice()
	if (curvoice.sth && s && s.type == NOTE) {
		s.sth = curvoice.sth;
		curvoice.sth = null
	}
	return s
    },

    set_format: function(of, cmd, param, lock) {
	if (cmd == "sth") {
	    var	curvoice = this.get_curvoice()
		if (this.parse.state == 2)
			this.goto_tune()
		if (curvoice)
			curvoice.sth = param.split(/[ \t;-]+/)
		return
	}
	of(cmd, param, lock)
    },

    set_stems: function(of) {
	of();
	abc2svg.sth.set_sth.call(this)
    }

} // sth

abc2svg.modules.hooks.push(
// export
	"goto_tune",
	"parse",
// hooks
	[ "calculate_beam", "abc2svg.sth.calculate_beam" ],
	[ "new_note", "abc2svg.sth.new_note" ],
	[ "set_format", "abc2svg.sth.set_format" ],
	[ "set_stems", "abc2svg.sth.set_stems" ]
);

// the module is loaded
abc2svg.modules.sth.loaded = true
