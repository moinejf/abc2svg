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
    recal_beam: function(abc, bm, s) {
    var staff_tb = abc.get_st_tb(),
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
    set_sth: function(abc, voice_tb) {
    var s, h, v, sth_a, p_voice
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
			h = Number(h)
			if (isNaN(h))
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
    }
} // sth

// inject code inside the core
abc2svg.inject += '\
Abc.prototype.get_st_tb = function() {return staff_tb}\n\
var sth = {\n\
	cb: calculate_beam,\n\
	nn: new_note,\n\
	set_fmt: set_format,\n\
	set_st: set_stems\n\
}\n\
calculate_beam = function(bm, s1) {\n\
    var	done = sth.cb(bm, s1)\n\
	if (done && bm.s2 && s1.sth)\n\
		abc2svg.sth.recal_beam(self, bm, s1)\n\
	return done\n\
}\n\
new_note = function(grace, tp_fact) {\n\
   var	s = sth.nn(grace, tp_fact)\n\
	if (curvoice.sth && s && s.type == NOTE) {\n\
		s.sth = curvoice.sth;\n\
		curvoice.sth = null\n\
	}\n\
}\n\
set_format = function(cmd, param, lock) {\n\
	if (cmd == "sth") {\n\
		if (parse.state == 2)\n\
			goto_tune()\n\
		if (curvoice)\n\
			curvoice.sth = param.split(/[ \t-]+/)\n\
		return\n\
	}\n\
	sth.set_fmt(cmd, param, lock)\n\
}\n\
set_stems = function() {\n\
	sth.set_st();\n\
	abc2svg.sth.set_sth(self, voice_tb)\n\
}\n\
';

// the module is loaded
abc2svg.modules.sth.loaded = true
