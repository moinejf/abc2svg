// combine.js - module to add a combine chord line
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%voicecombine" appears in a ABC source.
//
// Parameters
//	%%voicecombine n	'n' is the combine level

function Combine(abc_i) {
    var abc = abc_i

    // constants from the abc2svg core
    var	NOTE = 8,
	REST = 10,
	SL_ABOVE = 0x01,
	SL_BELOW = 0x02,
	SL_AUTO = 0x03,
	SL_DOTTED = 0x08

    // check if voice combine may occur
    function may_combine(s) {
    var	nhd2,
	s2 = s.ts_next

	if (!s2 || (s2.type != NOTE && s2.type != REST))
		return false
	if (s2.v == s.v
	 || s2.st != s.st
	 || s2.time != s.time
	 || s2.dur != s.dur)
		return false
	if (s.combine <= 0
	 && s2.type != s.type)
		return false
//	if (s2.a_dd) { //fixme: should check the double decorations
//		return false
//	}
	if (s.a_gch && s2.a_gch)
		return false
	if (s.type == REST) {
		if (s.type == s2.type && s.invis && !s2.invis)
			return false
		return true
	}
	if (s2.a_ly
	 || s2.sl1 || s2.sl2
	 || s2.slur_start || s2.slur_end)
		return false
	if (s2.beam_st != s.beam_st
	 || s2.beam_end != s.beam_end)
		return false;
	nhd2 = s2.nhd
	if (s.combine <= 1
	 && s.notes[0].pit <= s2.notes[nhd2].pit + 1)
		return false
	return true
    }

    // combine two notes
    function combine_notes(s, s2) {
    var	nhd, type, m;

	s.notes = s.notes.concat(s2.notes);
	s.nhd = nhd = s.notes.length - 1;
	abc.sort_pitch(s)		// sort the notes by pitch

	if (s.combine >= 3) {		// remove unison heads
		for (m = nhd; m > 0; m--) {
			if (s.notes[m].pit == s.notes[m - 1].pit
			 && s.notes[m].acc == s.notes[m - 1].acc)
				s.notes.splice(m, 1)
		}
		s.nhd = nhd = s.notes.length - 1
	}

	s.ymx = 3 * (s.notes[nhd].pit - 18) + 4;
	s.ymn = 3 * (s.notes[0].pit - 18) - 4;

	// force the tie directions
	type = s.notes[0].ti1
	if ((type & 0x0f) == SL_AUTO)
		s.notes[0].ti1 = SL_BELOW | (type & ~SL_DOTTED);
	type = s.notes[nhd].ti1
	if ((type & 0x0f) == SL_AUTO)
		s.notes[nhd].ti1 = SL_ABOVE | (type & ~SL_DOTTED)
}

// combine 2 voices
function do_combine(s) {
	var s2, nhd, nhd2, type

	while (1) {
		nhd = s.nhd;
		s2 = s.ts_next;
		nhd2 = s2.nhd
		if (s.type != s2.type) {	// if note and rest
			if (s2.type != REST) {
				s2 = s;
				s = s2.ts_next
			}
		} else if (s.type == REST) {
			if (s.invis
			 && !s2.invis)
				delete s.invis
		} else {
			combine_notes(s, s2)
		}

		if (s2.a_gch)
			s.a_gch = s2.a_gch
		if (s2.a_dd) {
			if (!s.a_dd)
				s.a_dd = s2.a_dd
			else
				s.a_dd = s.a_dd.concat(s2.a_dd)
		}
		abc.unlksym(s2)			// remove the next symbol

		// there may be more voices
		if (s.in_tuplet || !may_combine(s))
			break
	}
}

    // function called at start of the generation when multi-voices
    Combine.prototype.comb_v = function() {
	var s, s2, g, i, r

	for (s = abc.get_tsfirst(); s; s = s.ts_next) {
		switch (s.type) {
		case REST:
			if (s.combine == undefined || s.combine < 0)
				continue
			if (may_combine(s))
				do_combine(s)
			continue
		default:
			continue
		case NOTE:
			if (s.combine == undefined || s.combine <= 0)
				continue
			break
		}

		if (!s.beam_st)
			continue
		if (s.beam_end) {
			if (may_combine(s))
				do_combine(s)
			continue
		}

		s2 = s
		while (1) {
			if (!may_combine(s2)) {
				s2 = null
				break
			}
//fixme: may have rests in beam
			if (s2.beam_end)
				break
			do {
				s2 = s2.next
			} while (s2.type != NOTE && s2.type != REST)
		}
		if (!s2)
			continue
		s2 = s
		while (1) {
			do_combine(s2)
//fixme: may have rests in beam
			if (s2.beam_end)
				break
			do {
				s2 = s2.next
			} while (s2.type != NOTE && s2.type != REST)
		}
	}
    } // comb_v()

    // set the combine parameter in the current voice
    Combine.prototype.set_comb = function(a) {
    var	i,
	curvoice = abc.get_curvoice()

	for (i = 0; i < a.length; i++) {
		switch (a[i]) {
		case "combine=":			// %%voicecombine
			curvoice.combine = a[i + 1]
			break
		}
	}
    } // set_comb()

// Combine creation

	// export some functions/variables
	abc.tosvg('combine', '\
%%beginjs\n\
Abc.prototype.get_curvoice = function() { return curvoice }\n\
Abc.prototype.get_tsfirst = function() { return tsfirst }\n\
Abc.prototype.set_v_param = set_v_param\n\
Abc.prototype.sort_pitch = sort_pitch\n\
Abc.prototype.unlksym = unlksym\n\
\
var combine = {\n\
	new_n: new_note,\n\
	psc: do_pscom,\n\
	set_sd: set_stem_dir,\n\
	set_vp: set_vp\n\
}\n\
new_note = function(gr, tp) {\n\
	var s = combine.new_n(gr, tp)\n\
	if (s && s.notes && curvoice.combine != undefined)\n\
		s.combine = curvoice.combine\n\
}\n\
do_pscom = function(text) {\n\
	if (text.slice(0, 13) == "voicecombine ")\n\
		set_v_param("combine", text.split(/[ \t]/)[1])\n\
	else\n\
		combine.psc(text)\n\
}\n\
set_stem_dir = function() {\n\
	combine.set_sd();\n\
	Combine.prototype.comb_v()\n\
}\n\
set_vp = function(a) {\n\
	Combine.prototype.set_comb(a);\n\
	combine.set_vp(a)\n\
}\n\
%%endjs\n\
')

} // Combine()
