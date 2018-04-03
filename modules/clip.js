// clip.js - module to handle the %%clip command
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%clip" appears in a ABC source.
//
// Parameters
//	%%clip start_measure_nb [":" num "/" den] "-" end_measure_nb [":" num "/" den]

function Clip(i_abc) {
    var	abc = i_abc

// constants from the abc2svg core
    var	BAR = 0,
	CLEF = 1,
	KEY = 5,
	METER = 6,
	STAVES = 12,
	BASE_LEN = 1536

	// get the start/stop points
	function get_symsel(a) {
	    var	j, d, sq,
		b = a.match(/(\d)([a-z]?)(:\d\/\d)?/)

		if (!b)
			return
		if (b[2])
			sq = b[2].charCodeAt(0) - 0x61
		if (!b[3])
			return {m: b[1], t: 0, sq: sq}	// on measure bar
		a = b[3].match(/:(\d)\/(\d)/)
		if (!a || a[2] < 1)
			return
		return {m: b[1], t: a[1] * BASE_LEN / a[2], sq: sq}
	} // get_symsel()

	// %%break start_measure [":" num "/" den] "-" end_measure ...
	Clip.prototype.get_clip = function(parm) {
	    var	b, c,
		a = parm.split(/[ -]/)

		if (a.length != 3) {
			abc.syntax(1, abc.err_bad_val_s, "%%clip")
			return
		}
		if (!b)
			b = {m: 0, t: 0}
		else
			b = get_symsel(a[1]);
		c = get_symsel(a[2])
		if (!b || !c) {
			abc.syntax(1, abc.err_bad_val_s, "%%clip")
			return
		}
		abc.glovar.clip = [b, c]
	} // get_clip()

	// go to a global (measure + time)
	function go_global_time(s, sel) {
	    var	s2, bar_time, seq

		if (sel.m <= 1) {	// special case: there is no measure 0/1
			if (sel.m == 1) {
				for (s2 = s; s2; s2 = s2.ts_next) {
					if (s2.type == BAR
					 && s2.time != 0)
						break
				}
				if (s2.time < abc.voice_tb[abc.get_cur_sy().top_voice].
								meter.wmeasure)
					s = s2
			}
		} else {
			for ( ; s; s = s.ts_next) {
				if (s.type == BAR
				 && s.bar_num >= sel.m)
					break
			}
			if (!s)
				return // null

			if (sel.sq) {
				seq = sel.sq
				for (s = s.ts_next; s; s = s.ts_next) {
					if (s.type == BAR
					 && s.bar_num == sel.m) {
						if (--seq == 0)
							break
					}
				}
				if (!s)
					return // null
			}
		}

		if (sel.t == 0)
			return s;
		bar_time = s.time + sel.t
		while (s.time < bar_time) {
			s = s.ts_next
			if (!s)
				return s
		}
		do {
			s = s.ts_prev	// go back to the previous sequence
		} while (!s.seqst)
		return s
	}

	// cut the tune
	Clip.prototype.do_clip = function() {
	    var	s, s2, sy, p_voice, v

		// remove the beginning of the tune
		s = abc.get_tsfirst()
		if (abc.glovar.clip[0].m > 0
		 || abc.glovar.clip[0].t > 0) {
			s = go_global_time(s, abc.glovar.clip[0])
			if (!s) {
				abc.set_tsfirst(null)
				return
			}

			// update the start of voices
			sy = abc.get_cur_sy()
			for (s2 = abc.get_tsfirst(); s2 != s; s2 = s2.ts_next) {
				switch (s2.type) {
				case CLEF:
					s2.p_v.clef = s2
					break
				case KEY:
					s2.p_v.key = abc.clone(s2.as.u.key)
					break
				case METER:
					s2.p_v.meter = abc.clone(s2.as.u.meter)
					break
				case STAVES:
					sy = s2.sy;
					abc.set_cur_sy(sy)
					break
				}
			}
			for (v = 0; v < abc.voice_tb.length; v++) {
				p_voice = abc.voice_tb[v]
				for (s2 = s; s2; s2 = s2.ts_next) {
					if (s2.v == v) {
						delete s2.prev
						break
					}
				}
				p_voice.sym = s2
			}
			abc.set_tsfirst(s)
			delete s.ts_prev
		}

		/* remove the end of the tune */
		s = go_global_time(s, abc.glovar.clip[1])
		if (!s)
			return

		/* keep the current sequence */
		do {
			s = s.ts_next
			if (!s)
				return
		} while (!s.seqst)

		/* cut the voices */
		for (v = 0; v < abc.voice_tb.length; v++) {
			p_voice = abc.voice_tb[v]
			for (s2 = s.ts_prev; s2; s2 = s2.ts_prev) {
				if (s2.v == v) {
					delete s2.next
					break
				}
			}
			if (!s2)
				p_voice.sym = null
		}
		delete s.ts_prev.ts_next
	} // do_clip()

// Clip creation

	//export some functions/variables
	abc.tosvg('clip', '\
%%beginjs\n\
Abc.prototype.clone = clone\n\
Abc.prototype.get_cur_sy = function() { return cur_sy }\n\
Abc.prototype.err_bad_val_s = err_bad_val_s\n\
Abc.prototype.get_tsfirst = function() { return tsfirst }\n\
Abc.prototype.glovar = glovar\n\
Abc.prototype.set_cur_sy = function(sy) { cur_sy = sy }\n\
Abc.prototype.set_tsfirst = function(s) { tsfirst = s }\n\
Abc.prototype.syntax = syntax\n\
Abc.prototype.voice_tb = voice_tb\n\
\
var clip = {\n\
	psc: do_pscom,\n\
	sbn: set_bar_num\n\
}\n\
do_pscom = function(text) {\n\
	if (text.slice(0, 5) == "clip ")\n\
		Clip.prototype.get_clip(text)\n\
	else\n\
		clip.psc(text)\n\
}\n\
set_bar_num = function() {\n\
	clip.sbn();\n\
	Clip.prototype.do_clip()\n\
}\n\
%%endjs\n\
')

} // Clip()
