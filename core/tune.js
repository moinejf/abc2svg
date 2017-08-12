// abc2svg - tune.js - tune generation
//
// Copyright (C) 2014-2017 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

var	par_sy,		// current staff system for parse
	cur_sy,		// current staff system for generation
	voice_tb,
	curvoice,
	staves_found,
	vover,		// voice overlay
	tsfirst

/* apply the %%voice options of the current voice */
function voice_filter() {
	var opt, sel, tmp, i

	for (opt in parse.voice_opts) {
		if (!parse.voice_opts.hasOwnProperty(opt))
			continue
		sel = new RegExp(opt)
		if (sel.test(curvoice.id)
		 || sel.test(curvoice.nm)) {
			for (i in parse.voice_opts[opt])
			    if (parse.voice_opts[opt].hasOwnProperty(i))
				do_pscom(parse.voice_opts[opt][i])
		}
	}
}

/* -- link a ABC symbol into the current voice -- */
function sym_link(s) {
	if (!s.ctx)
		set_ref(s)
	if (!curvoice.ignore) {
		parse.last_sym = s;
		s.prev = curvoice.last_sym
		if (curvoice.last_sym)
			curvoice.last_sym.next = s
		else
			curvoice.sym = s;
		curvoice.last_sym = s
	}
	s.v = curvoice.v;
	s.p_v = curvoice;
	s.st = curvoice.cst;
	s.time = curvoice.time
	if (s.dur && !s.grace)
		curvoice.time += s.dur;
	s.pos = curvoice.pos
	if (curvoice.second)
		s.second = true
	if (curvoice.floating)
		s.floating = true
}

/* -- add a new symbol in a voice -- */
function sym_add(p_voice, type) {
	var	s = {
			type:type,
			dur:0
		},
		s2,
		p_voice2 = curvoice;

	curvoice = p_voice;
	sym_link(s);
	curvoice = p_voice2;
	s2 = s.prev
	if (!s2)
		s2 = s.next
	if (s2) {
		s.ctx = s2.ctx;
		s.istart = s2.istart;
		s.iend = s2.iend
	}
	return s
}

/* -- expand a multi-rest into single rests and measure bars -- */
function mrest_expand(s) {
	var	p_voice, s2, next,
		nb = s.nmes,
		dur = s.dur / nb

	/* change the multi-rest (type bar) to a single rest */
	var a_dd = s.a_dd;
	s.type = REST;
	s.dur = dur;
	s.head = FULL;
	s.nflags = -2;

	/* add the bar(s) and rest(s) */
	next = s.next;
	p_voice = s.p_v;
	p_voice.last_sym = s;
	p_voice.time = s.time + dur;
	p_voice.cst = s.st;
	s2 = s
	while (--nb > 0) {
		s2 = sym_add(p_voice, BAR);
		s2.bar_type = "|";
		s2 = sym_add(p_voice, REST);
		if (s.invis)
			s2.invis = true;
		s2.dur = dur;
		s2.head = FULL;
		s2.nflags = -2;
		p_voice.time += dur
	}
	s2.next = next
	if (next)
		next.prev = s2;

	/* copy the mrest decorations to the last rest */
	s2.a_dd = a_dd
}

/* -- sort all symbols by time and vertical sequence -- */
// weight of the symbols !! depends on the symbol type !!
var w_tb = new Uint8Array([
	2,	// bar
	1,	// clef
	8,	// custos
	0,	// (free)
	3,	// grace
	5,	// key
	6,	// meter
	9,	// mrest
	9,	// note
	0,	// part
	9,	// rest
	3,	// space
	0,	// staves
	7,	// stbrk
	0,	// tempo
	0,	// (free)
	0,	// block
	0	// remark
])

function sort_all() {
	var	s, s2, p_voice, v, time, w, wmin, ir, multi,
		prev, nb,
		nv = voice_tb.length,
		vtb = [],
		vn = [],			/* voice indexed by range */
		mrest_time = -1

	for (v = 0; v < nv; v++)
		vtb.push(voice_tb[v].sym)

	/* initialize the voice order */
	var	fl = 1,
		sy = cur_sy,
		sy_w = 0,
		sy_time = 0,
		new_sy = 1

	while (1) {
		if (new_sy && fl) {
			new_sy = false;
			multi = -1;
			vn = []
			for (v = 0; v < nv; v++) {
				if (!sy.voices[v]) {
					sy.voices[v] = {
						range: -1
					}
					continue
				}
				ir = sy.voices[v].range
				if (ir < 0)
					continue
				vn[ir] = v;
				multi++
			}
		}

		/* search the min time and symbol weight */
		wmin = time = 1000000				/* big int */
		for (ir = 0; ir < nv; ir++) {
			v = vn[ir]
			if (v == undefined)
				break
			s = vtb[v]
			if (!s || s.time > time)
				continue
			w = w_tb[s.type]
			if (s.time < time) {
				time = s.time;
				wmin = w
			} else if (w < wmin) {
				wmin = w
			}
			if (s.type == MREST) {
				if (s.nmes == 1)
					mrest_expand(s)
				else if (multi > 0)
					mrest_time = time
			}
		}

		if (wmin > 127) {
			if (new_sy && !fl) {	// if %%score with no common voice
				fl = 1
				continue
			}
			break			// done
		}

		/* if some multi-rest and many voices, expand */
		if (time == mrest_time) {
			nb = 0
			for (ir = 0; ir < nv; ir++) {
				v = vn[ir]
				if (v == undefined)
					break
				s = vtb[v]
				if (!s || s.time != time
				 || w_tb[s.type] != wmin)
					continue
				if (s.type != MREST) {
					mrest_time = -1 /* some note or rest */
					break
				}
				if (nb == 0) {
					nb = s.nmes
				} else if (nb != s.nmes) {
					mrest_time = -1	/* different duration */
					break
				}
			}
			if (mrest_time < 0) {
				for (ir = 0; ir < nv; ir++) {
					v = vn[ir]
					if (v == undefined)
						break
					s = vtb[v]
					if (s && s.type == MREST)
						mrest_expand(s)
				}
			}
		}

		// continue the time sequence after STAVES
		if (sy_w) {
			if (sy_w < 0) {		// init
				sy_w = wmin
			} else if (sy_time == time && sy_w == wmin) {
				fl = 0
			} else {
				sy_w = 0
			}
		}

		/* link the vertical sequence */
		for (ir = 0; ir < nv; ir++) {
			v = vn[ir]
			if (v == undefined)
				break
			s = vtb[v]
			if (!s || s.time != time
			 || w_tb[s.type] != wmin)
				continue
			if (s.type == STAVES) {
				sy = s.sy;
				new_sy = true;
				sy_w = -1;
				sy_time = s.time
			}
			if (fl) {
				fl = 0;
				s.seqst = true
			}
			s.ts_prev = prev
			if (prev)
				prev.ts_next = s
			else
				tsfirst = s;
			prev = s

			vtb[v] = s.next
		}
		fl = wmin		/* start a new sequence if some width */
	}

	if (!prev)
		return

	/* if no bar nor space at end of tune, add some space */
	if (prev.dur) {
		p_voice = prev.p_v;
		p_voice.last_sym = prev;
		s = sym_add(p_voice, SPACE);
		s.time = prev.time + prev.dur;
		s.seqst = true;
		s.width = 6;
		prev.ts_next = s;
		s.ts_prev = prev
		while (1) {
			delete prev.eoln
			if (prev.seqst)
				break
			prev = prev.ts_prev
		}
	}
}

// adjust some voice elements
function voice_adj() {
	var p_voice, s, s2, s3, v

	// set the duration of the notes under a feathered beam
	function set_feathered_beam(s1) {
		var	s, s2, t, d, b, i, a,
			d = s1.dur,
			n = 1

		/* search the end of the beam */
		for (s = s1; s; s = s.next) {
			if (s.beam_end || !s.next)
				break
			n++
		}
		if (n <= 1) {
			delete s1.feathered_beam
			return
		}
		s2 = s;
		b = d / 2;		/* smallest note duration */
		a = d / (n - 1);	/* delta duration */
		t = s1.time
		if (s1.feathered_beam > 0) {	/* !beam-accel! */
			for (s = s1, i = n - 1;
			     s != s2;
			     s = s.next, i--) {
				d = ((a * i) | 0) + b;
				s.dur = d;
				s.time = t;
				t += d
			}
		} else {				/* !beam-rall! */
			for (s = s1, i = 0;
			     s != s2;
			     s = s.next, i++) {
				d = ((a * i) | 0) + b;
				s.dur = d;
				s.time = t;
				t += d
			}
		}
		s.dur = s.time + s.dur - t;
		s.time = t
	} // end set_feathered_beam()

	/* if Q: from tune header, put it at start of the music */
	s = glovar.tempo
	if (s && staves_found <= 0) {	// && !s.del) {		- play problem
		v = par_sy.top_voice;
		p_voice = voice_tb[v];
		s.v = v;
		s.p_v = p_voice;
		s.st = p_voice.st;
		s.time = 0;
		s.next = p_voice.sym
		if (s.next)
			s.next.prev = s;
		p_voice.sym = s
	}

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.ignore)
			p_voice.ignore = false
		for (s = p_voice.sym; s; s = s.next) {
			if (s.time >= staves_found)
				break
		}
		for ( ; s; s = s.next) {
			switch (s.type) {
//			case CLEF:	// move the clefs before the measure bars
//				for (s2 = s.prev; s2; s2 = s2.prev) {
//					switch (s2.type) {
//					case BAR:
//						if (s2.time != s.time)
//							break
//
//						/* move the clef */
//						s.next.prev = s.prev;
//						s.prev.next = s.next;
//						s.next = s2;
//						s.prev = s2.prev;
//						s.prev.next = s;
//						s2.prev = s
//						break
//					case MREST:
//					case NOTE:
//					case REST:
//					case SPACE:
//					case STBRK:
//						break
//					default:
//						continue
//					}
//					break
//				}
//				continue
			case GRACE:
				// with w_tb[BAR] = 2,
				// the grace notes go after the bar;
				// if before a bar, change the grace time
				if (s.next && s.next.type == BAR)
					s.time--

				if (!cfmt.graceword)
					continue
				for (s2 = s.next; s2; s2 = s2.next) {
					switch (s2.type) {
					case SPACE:
						continue
					case NOTE:
						if (!s2.a_ly)
							break
						s.a_ly = s2.a_ly;
						s2.a_ly = null
						break
					}
					break
				}
				continue
			}

			if (s.feathered_beam)
				set_feathered_beam(s)
		}
	}
}

/* -- duplicate the voices as required -- */
function dupl_voice() {
	var	p_voice, p_voice2, s, s2, g, g2, v, i,
		nv = voice_tb.length

	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v];
		p_voice2 = p_voice.clone
		if (!p_voice2)
			continue
		p_voice.clone = null
		for (s = p_voice.sym; s; s = s.next) {
//fixme: there may be other symbols before the %%staves at this same time
			if (s.time >= staves_found)
				break
		}
		p_voice2.clef = clone(p_voice.clef);
		curvoice = p_voice2
		for ( ; s; s = s.next) {
			if (s.type == STAVES)
				continue
			s2 = clone(s)
			if (s.notes) {
				s2.notes = []
				for (i = 0; i <= s.nhd; i++)
					s2.notes.push(clone(s.notes[i]))
			}
			sym_link(s2)
//			s2.time = s.time
			if (p_voice2.second)
				s2.second = true
			else
				delete s2.second
			if (p_voice2.floating)
				s2.floating = true
			else
				delete s2.floating
			delete s2.a_ly;
			g = s2.extra
			if (!g)
				continue
			g2 = clone(g);
			s2.extra = g2;
			s2 = g2;
			s2.v = p_voice2.v;
			s2.p_v = p_voice2;
			s2.st = p_voice2.st
			for (g = g.next; g; g = g.next) {
				g2 = clone(g)
				if (g.notes) {
					g2.notes = []
					for (i = 0; i <= g.nhd; i++)
						g2.notes.push(clone(g.notes[i]))
				}
				s2.next = g2;
				g2.prev = s2;
				s2 = g2;
				s2.v = p_voice2.v;
				s2.p_v = p_voice2;
				s2.st = p_voice2.st
			}
		}
	}
}

/* -- create a new staff system -- */
function new_syst(init) {
	var	st, v,
		sy_new = {
			voices: [],
			staves: [],
			top_voice: 0
		}

	if (init) {				/* first staff system */
		cur_sy = par_sy = sy_new
		return
	}

	// update the previous system
	for (v = 0; v < voice_tb.length; v++) {
		st = par_sy.voices[v].st
		var	sy_staff = par_sy.staves[st],
			p_voice = voice_tb[v]
		if (p_voice.stafflines != undefined)
			sy_staff.stafflines = p_voice.stafflines
		if (p_voice.staffscale)
			sy_staff.staffscale = p_voice.staffscale;
		sy_new.voices[v] = clone(par_sy.voices[v]);
		sy_new.voices[v].range = -1;
		delete sy_new.voices[v].second
	}
	for (st = 0; st < par_sy.staves.length; st++) {
		sy_new.staves[st] = clone(par_sy.staves[st]);
		sy_new.staves[st].flags = 0
	}
	par_sy.next = sy_new;
	par_sy = sy_new
}

/* go to a global (measure + time) */
function go_global_time(s, symsel) {
	var s2, bar_time, seq

	if (symsel.bar <= 1) {		/* special case: there is no measure 0/1 */
//	 && nbar == -1) {		/* see set_bar_num */
		if (symsel.bar == 1) {
			for (s2 = s; s2; s2 = s2.ts_next) {
				if (s2.type == BAR
				 && s2.time != 0)
					break
			}
			if (s2.time < voice_tb[cur_sy.top_voice].meter.wmeasure)
				s = s2
		}
	} else {
		for ( ; s; s = s.ts_next) {
			if (s.type == BAR
			 && s.bar_num >= symsel.bar)
				break
		}
		if (!s)
			return null
		if (symsel.seq != 0) {
			seq = symsel.seq
			for (s = s.ts_next; s; s = s.ts_next) {
				if (s.type == BAR
				 && s.bar_num == symsel.bar) {
					if (--seq == 0)
						break
				}
			}
			if (!s)
				return null
		}
	}

	if (symsel.time == 0)
		return s;
	bar_time = s.time + symsel.time
	while (s.time < bar_time) {
		s = s.ts_next
		if (!s)
			return s
	}
	do {
		s = s.ts_prev		/* go back to the previous sequence */
	} while (!s.seqst)
	return s
}

/* treat %%clip */
function do_clip() {
	var s, s2, sy, p_voice, v

	/* remove the beginning of the tune */
	s = tsfirst
	if (clip_start.bar > 0
	 || clip_start.time > 0) {
		s = go_global_time(s, clip_start)
		if (!s) {
			tsfirst = null
			return
		}

		/* update the start of voices */
		sy = cur_sy
		for (s2 = tsfirst; s2 != s; s2 = s2.ts_next) {
			switch (s2.type) {
			case CLEF:
				s2.p_v.clef = s2
				break
			case KEY:
				s2.p_v.key = clone(s2.as.u.key)
				break
			case METER:
				s2.p_v.meter = clone(s2.as.u.meter)
				break
			case STAVES:
				sy = s.sy
				break
			}
		}
		cur_sy = sy
		for (v = 0; v < voice_tb.length; v++) {
			p_voice = voice_tb[v]
			for (s2 = s; s2; s2 = s2.ts_next) {
				if (s2.v == v) {
					delete s2.prev
					break
				}
			}
			p_voice.sym = s2
		}
		tsfirst = s
		delete s.ts_prev
	}

	/* remove the end of the tune */
	s = go_global_time(s, clip_end)
	if (!s)
		return

	/* keep the current sequence */
	do {
		s = s.ts_next
		if (!s)
			return
	} while (!s.seqst)

	/* cut the voices */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
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
}

/* -- set the bar numbers and treat %%clip / %%break -- */
function set_bar_num() {
	var	s, s2, s3, tim,
		v = cur_sy.top_voice,
		wmeasure = voice_tb[v].meter.wmeasure,
		bar_rep = gene.nbar

	// insert the EOL of %%break
	function do_break() {
		var s, i, m, n, d, t

		for (i = 0; i < glovar.break.length; i++) {
			m = glovar.break[i].m
			n = glovar.break[i].n
			d = glovar.break[i].d
			for (s = voice_tb[v].sym; s; s = s.next) {
				if (s.type == BAR && s.bar_num == m)
					break
			}
			if (!s)
				continue
			if (n != 0) {
				t = s.time + n / d
				for ( ; s; s = s.next) {
					if (s.time > t)
						break
				}
				if (!s)
					continue
			}
			s.eoln = true
		}
	} // do_break

	/* don't count a bar at start of line */
	for (s = tsfirst; ; s = s.ts_next) {
		if (!s)
			return
		switch (s.type) {
		case METER:
		case CLEF:
		case KEY:
		case STBRK:
			continue
		case BAR:
			if (s.bar_num) {
				gene.nbar = s.bar_num	/* (%%setbarnb) */
				break
			}
			if (s.text			// if repeat bar
			 && !cfmt.contbarnb) {
				if (s.text[0] == '1') {
					bar_rep = gene.nbar
				} else {
					gene.nbar = bar_rep; /* restart bar numbering */
					s.bar_num = gene.nbar
				}
			}
			break
		}
		break
	}

	// set the measure number on the top bars
//	// and move the clefs before the measure bars
	var	bar_time = s.time + wmeasure, // for incomplete measure at start of tune
		bar_num = gene.nbar

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
//		case CLEF:
//			for (s2 = s.ts_prev; s2; s2 = s2.ts_prev) {
//				switch (s2.type) {
//				case BAR:
//					if (s2.seqst)
//						break
//					continue
//				case MREST:
//				case NOTE:
//				case REST:
//				case SPACE:
//				case STAVES:
//				case STBRK:
//					s2 = undefined
//					break
//				default:
//					continue
//				}
//				break
//			}
//			if (!s2)
//				break
//
//			/* move the clef */
//			s.next.prev = s.prev;
//			s.prev.next = s.next;
//			s.ts_next.ts_prev = s.ts_prev;
//			s.ts_prev.ts_next = s.ts_next;
//			s.next = s2;
//			s.prev = s2.prev;
//			if s.prev)
//				s.prev.next = s;
//			s2.prev = s;
//			s.ts_next = s2;
//			s.ts_prev = s2.ts_prev;
//			s.ts_prev.ts_next = s;
//			s2.ts_prev = s
//			s = s2
//			break
		case METER:
			wmeasure = s.wmeasure
			if (s.time < bar_time)
				bar_time = s.time + wmeasure
			break
		case MREST:
			bar_num += s.nmes - 1
			while (s.ts_next
			    && s.ts_next.type != BAR)
				s = s.ts_next
			break
		case BAR:
			if (s.bar_num) {
				bar_num = s.bar_num		/* (%%setbarnb) */
				if (s.time < bar_time) {
					delete s.bar_num
					break
				}
			} else {
				if (s.time < bar_time)	/* incomplete measure */
					break
				bar_num++
			}

			/* check if any repeat bar at this time */
			tim = s.time;
			s2 = s
			do {
				if (s2.type == BAR
				 && s2.text		// if repeat bar
				 && !cfmt.contbarnb) {
					if (s2.text[0] == '1')
						bar_rep = bar_num
					else		/* restart bar numbering */
						bar_num = bar_rep
					break
				}
				s2 = s2.next
			} while (s2 && s2.time == tim);
			s.bar_num = bar_num;
			bar_time = s.time + wmeasure
			break
		}
	}
//fixme
	/* do the %%clip stuff */
	/* do the %%break stuff */
	if (glovar.break)
		do_break()

	if (cfmt.measurenb < 0)		/* if no display of measure bar */
		gene.nbar = bar_num	/* update in case of more music to come */
}

// %%break measure_nb [":" num "/" den] [" " measure ...]*
function get_break(param) {
	var a = param.split(' '), b, c, d, i, j, k, n

	glovar.break = []
	for (k in a) {
		if (!a.hasOwnProperty(k))
			continue
		b = a[k];
		i = b.indexOf(':')
		if (i < 0) {
			glovar.break.push({m: b, n: 0, d: 1})
			continue
		}
		j = b.indexOf('/')
		if (j < 0) {
			syntax(1, "'/' missing in %%break")
			break
		}
		d = parseInt(b.slice(j + 1))
		if (isNaN(d) || d <= 1) {
			syntax(1, "Bad denominator in %%break")
			break
		}
		glovar.break.push({
			m: b.slice(0, i - 1),
			n: b.slice(i + 1, j - 1),
			d: d})
	}
}

// note mapping
// %%map map_name note [print [note_head]] [param]*
function get_map(text) {
	if (!text)
		return

	var	i, note, notes, map, tmp, ns,
		a = info_split(text, 2)

	if (a.length < 3) {
		syntax(1, "Not enough parameters in %%map")
		return
	}
	ns = a[1]
	if (ns.indexOf("octave,") == 0
	 || ns.indexOf("key,") == 0) {		// remove the octave part
		ns = ns.replace(/[,']+$/m, '').toLowerCase(); //'
		if (ns[0] == 'k')		// remove the accidental part
			ns = ns.replace(/[_=^]+/, '')
	} else if (ns[0] == '*' || ns.indexOf("all") == 0) {
		ns = 'all'
	} else {				// exact pitch, rebuild the note
		tmp = new scanBuf();
		tmp.buffer = a[1];
		note = parse_acc_pit(tmp)
		if (!note) {
			syntax(1, "Bad note in %%map")
			return
		}
		ns = 'abcdefg'[(note.pit + 77) % 7]
		if (note.acc)
			ns = ['__', '_', '', '^', '^^', '='][note.acc + 2] + ns
		for (i = note.pit; i >= 28; i -= 7)
			ns += "'"
		for (i = note.pit; i < 21; i += 7)
			ns += ","
	}

	notes = maps[a[0]]
	if (!notes)
		maps[a[0]] = notes = {}
	map = notes[ns]
	if (!map)
		notes[ns] = map = []

	/* try the optional 'print' and 'heads' parameters */
	if (!a[2])
		return
	i = 2
	if (a[2].indexOf('=') < 0) {
		if (a[2][0] != '*') {
			tmp = new scanBuf();		// print
			tmp.buffer = a[2];
			map[1] = parse_acc_pit(tmp)
		}
		if (!a[3])
			return
		i++
		if (a[3].indexOf('=') < 0) {
			map[0] = a[3].split(',');
			i++
		}
	}

	for (; i < a.length; i++) {
		switch (a[i]) {
		case "heads=":
			map[0] = a[++i].split(',')
			break
		case "print=":
			tmp = new scanBuf();
			tmp.buffer = a[++i];
			map[1] = parse_acc_pit(tmp)
			break
//		case "transpose=":
//			switch (a[++i][0]) {
//			case "n":
//				map[2] = false
//				break
//			case "y":
//				map[2] = true
//				break
//			}
//			break
		case "color=":
			map[2] = a[++i]
			break
		}
	}
}

// %%MIDI
function get_midi(param) {
	var	chan, prog,
		a = param.split(/\s+/)

	switch (a[0]) {
	case "program":
		if (a[2]) {		// channel program
			chan = a[1];
			prog = a[2]
		} else {		// program
			chan = 0;
			prog = a[1]
		}
		prog = parseInt(prog)
		if (isNaN(prog) || prog < 0 || prog > 127) {
			syntax(1, "Bad program in %%MIDI")
			return
		}
		if (curvoice)
			curvoice.instr = prog
		else
			glovar.instr = prog
		break
	}
}

// set the transposition in the previous or starting key
function set_transp() {
	var	s, transp, vtransp

//	if (curvoice.clef.clef_type == "p")	// percussion
//		return
	if (curvoice.ckey.k_bagpipe || curvoice.ckey.k_drum)
		return

	if (cfmt.transp && (curvoice.transp || curvoice.shift))
		syntax(0, "Mix of old and new transposition syntaxes");

	transp = (cfmt.transp || 0) +		// %%transpose
		(curvoice.transp || 0) +	// score= / sound=
		(curvoice.shift || 0);		// shift=
	vtransp = curvoice.vtransp || 0
	if (transp == vtransp)
		return

	curvoice.vtransp = transp;

	s = curvoice.last_sym
	if (!s) {				// no symbol yet
		curvoice.key = clone(curvoice.okey);
		key_transp(curvoice.key);
		curvoice.ckey = clone(curvoice.key)
		if (curvoice.key.k_none)
			curvoice.key.k_sf = 0
		return
	}

	// set the transposition in the previous K:
	while (1) {
		if (s.type == KEY)
			break
		if (!s.prev) {
			s = curvoice.key
			break
		}
		s = s.prev
	}
//	s.k_sf = curvoice.okey.k_sf
//	if (curvoice.okey.k_none)
//		s.k_none = curvoice.okey.k_none
//	if (curvoice.okey.k_a_acc)
//		s.k_a_acc = curvoice.okey.k_a_acc;
	key_transp(s);
	curvoice.ckey = clone(s)
	if (curvoice.key.k_none)
		s.k_sf = 0
}

function set_ottava(dcn) {
	if (cfmt.sound)
		return
	switch (dcn) {
	case "15ma(":
		curvoice.ottava = -14
		break
	case "8va(":
		curvoice.ottava = -7
		break
	case "8vb(":
		curvoice.ottava = 7
		break
	case "15mb(":
		curvoice.ottava = 14
		break
	case "15ma)":
	case "8va)":
	case "8vb)":
	case "15mb)":
		curvoice.ottava = 0
		break
	}
}

/* -- process a pseudo-comment (%% or I:) -- */
function do_pscom(text) {
	var	h1, val, s, cmd, param, n, k, b,
		lock = false

	if (text.match(/ lock$/)) {
		lock = true;
		text = text.slice(0, -5).trim()
	}
	cmd = text.match(/(\w|-)+/)
	if (!cmd)
		return
	cmd = cmd[0];
	param = text.replace(cmd, '').trim()
	switch (cmd) {
	case "break":
		get_break(param)
		return
	case "center":
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.text = cnv_escape(param)
			return
		}
		write_text(cnv_escape(param), 'c')
		return
	case "clef":
		if (parse.state >= 2) {
			if (parse.state == 2)
				goto_tune();
			s = new_clef(param)
			if (s)
				get_clef(s)
		}
		return
	case "clip":
//fixme: to do
		return
	case "deco":
		deco_add(param)
		return
	case "linebreak":
		set_linebreak(param)
		return
	case "MIDI":
		get_midi(param)
		return
	case "map":
		get_map(param)
		return
	case "maxsysstaffsep":
		if (parse.state == 3) {
			par_sy.voices[curvoice.v].maxsep = get_unit(param)
			return
		}
		break
	case "multicol":
		generate()
		switch (param) {
		case "start":
			blk_out();
			multicol = {
				posy: posy,
				maxy: posy,
				lmarg: cfmt.leftmargin,
				rmarg: cfmt.rightmargin,
				state: parse.state
			}
			break
		case "new":
			if (!multicol) {
				syntax(1, "%%multicol new without start")
				break
			}
			if (posy > multicol.maxy)
				multicol.maxy = posy;
			if (parse.state == 3) {		// tune body
				s = new_block("leftmargin");
				s.param = multicol.lmarg.toFixed(2);
				s = new_block("rightmargin");
				s.param = multicol.rmarg.toFixed(2)
			} else {
				cfmt.leftmargin = multicol.lmarg;
				set_posx();
				cfmt.rightmargin = multicol.rmarg
			}
			posy = multicol.posy
			break
		case "end":
			if (!multicol) {
				syntax(1, "%%multicol end without start")
				break
			}
			if (posy < multicol.maxy)
				posy = multicol.maxy;
			if (parse.state == 3) {		// tune body
				s = new_block("leftmargin");
				s.param = multicol.lmarg.toFixed(2);
				s = new_block("rightmargin");
				s.param = multicol.rmarg.toFixed(2)
			} else {
				cfmt.leftmargin = multicol.lmarg;
				set_posx();
				cfmt.rightmargin = multicol.rmarg
			}
			multicol = undefined;
			blk_out()
			break
		default:
			syntax(1, "Unknown keyword '$1' in %%multicol", param)
			break
		}
		return
	case "musicfont":
		musicfont = param
		return
	case "ottava":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		n = parseInt(param)
		if (isNaN(n) || n < -2 || n > 2) {
			syntax(1, err_bad_val_s, "%%ottava")
			return
		}
		switch (curvoice.ottava) {
		case 14: b = "15mb)"; break
		case 7: b = "8vb)"; break
		case -7: b = "8va)"; break
		case -14: b = "15ma)"; break
		}
		if (b) {
			if (!curvoice.second) {
				if (!a_dcn)
					a_dcn = []
				a_dcn.push(b)
			}
			set_ottava(b)
		}
		switch (n) {
		case -2: b = "15mb("; break
		case -1: b = "8vb("; break
		case 0: return
		case 1: b = "8va("; break
		case 2: b = "15ma("; break
		}
		if (!curvoice.second) {
			if (!a_dcn)
				a_dcn = []
			a_dcn.push(b)
		}
		set_ottava(b)
		return
	case "repbra":
		if (parse.state >= 2) {
			if (parse.state == 2)
				goto_tune();
			curvoice.norepbra = !get_bool(param)
		}
		return
	case "repeat":
		if (parse.state != 3)
				return
		if (!curvoice.last_sym) {
			syntax(1, "%%repeat cannot start a tune")
			return
		}
		if (!param.length) {
			n = 1;
			k = 1
		} else {
			b = param.split(/\s+/);

			n = parseInt(b[0]);
			k = parseInt(b[1])
			if (isNaN(n) || n < 1
			 || (curvoice.last_sym.type == BAR
			  && n > 2)) {
				syntax(1, "Incorrect 1st value in %%repeat")
				return
			}
			if (isNaN(k)) {
				k = 1
			} else {
				if (k < 1) {
					syntax(1, "Incorrect 2nd value in %%repeat")
					return
				}
			}
		}
		parse.repeat_n = curvoice.last_sym.type == BAR ? n : -n;
		parse.repeat_k = k
		return
	case "sep":
		var	h2, len, values,
			lwidth = cfmt.pagewidth - cfmt.leftmargin - cfmt.rightmargin;

		h1 = h2 = len = 0
		if (param) {
			values = param.split(/\s+/);
			h1 = get_unit(values[0])
			if (values[1]) {
				h2 = get_unit(values[1])
				if (values[2])
					len = get_unit(values[2])
			}
		}
		if (h1 < 1)
			h1 = 14
		if (h2 < 1)
			h2 = h1
		if (len < 1)
			len = 90
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.x = (lwidth - len) / 2 / cfmt.scale;
			s.l = len / cfmt.scale;
			s.sk1 = h1;
			s.sk2 = h2
			return
		}
		vskip(h1);
		output.push('<path class="stroke"\n\td="M');
		out_sxsy((lwidth - len) / 2 / cfmt.scale, ' ', 0);
		output.push('h' + (len / cfmt.scale).toFixed(2) + '"/>\n');
		vskip(h2);
		blk_out()
		return
	case "setbarnb":
		val = parseInt(param)
		if (isNaN(val))
			syntax(1, "Bad %%setbarnb value")
		else if (parse.state >= 2)
			glovar.new_nbar = val
		else
			cfmt.measurefirst = val
		return
	case "staff":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		val = parseInt(param)
		if (isNaN(val)) {
			syntax(1, "Bad %%staff value '$1'", param)
			return
		}
		var st
		if (param[0] == '+' || param[0] == '-')
			st = curvoice.cst + val
		else
			st = val - 1
		if (st < 0 || st > nstaff) {
			syntax(1, "Bad %%staff number $1 (cur $2, max $3)",
					st, curvoice.cst, nstaff)
			return
		}
		delete curvoice.floating;
		curvoice.cst = st
		return
	case "staffbreak":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		s = {
			type: STBRK,
			dur:0
		}
		if (param[0] >= '0' && param[0] <= '9') {
			s.xmx = get_unit(param)
			if (param.slice(-1) == 'f')
				s.stbrk_forced = true
		} else {
			s.xmx = 14
			if (param[0] == 'f')
				s.stbrk_forced = true
		}
		sym_link(s)
		return
	case "stafflines":
		val = get_st_lines(param)
		if (val == undefined)
			syntax(1, "Bad %%stafflines value")
		else
			set_v_param(cmd, val)
		return
	case "staffscale":
		val = parseFloat(param)
		if (isNaN(val) || val < .3 || val > 2)
			syntax(1, "Bad %%staffscale value")
		else
			set_v_param(cmd, val)
		return
	case "staves":
	case "score":
		if (parse.state == 0)
			return
		get_staves(cmd, param)
		return
	case "sysstaffsep":
//--fixme: may be global
		if (parse.state == 3) {
			par_sy.voices[curvoice.v].sep = get_unit(param)
			return
		}
		break
	case "text":
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.text = cnv_escape(param);
			s.opt = cfmt.textoption
			return
		}
		write_text(cnv_escape(param), cfmt.textoption)
		return
	case "transpose":		// (abcm2ps compatibility)
		if (cfmt.sound)
			return
		switch (parse.state) {
		case 0:
			cfmt.transp = 0
			// fall thru
		case 1:
		case 2:
			cfmt.transp = (cfmt.transp || 0) + get_transp(param)
			return
//		case 2:
//			goto_tune()
//			break
		}
		for (s = curvoice.last_sym; s; s = s.prev) {
			switch (s.type) {
			case NOTE:		// insert a key
				s = clone(curvoice.okey);
				sym_link(s)
				break
			case KEY:
				break
			default:
				continue
			}
			break
		}
		do_info('V', curvoice.id + ' shift=' + param)
		return
	case "tune":
//fixme: to do
		return
	case "user":
		set_user(param)
		return
	case "voicecolor":
		if (parse.state != 3) {
			if (parse.state != 2)
				return
			goto_tune()
		}
		curvoice.color = param
		return
	case "vskip":
		val = get_unit(param)
		if (val < 0) {
			syntax(1, "%%vskip cannot be negative")
			return
		}
		if (parse.state >= 2) {
			s = new_block(cmd);
			s.sk = val
			return
		}
		vskip(val);
		blk_out()
		return
	case "newpage":
	case "leftmargin":
	case "rightmargin":
	case "pagescale":
	case "pagewidth":
	case "print-leftmargin":
	case "scale":
	case "staffwidth":
		if (parse.state == 3) {			// tune body
			s = new_block(cmd);
			s.param = param
			return
		}
		if (cmd == "newpage") {
			blk_flush();
			block.newpage = true
			return
		}
		set_format(cmd, param, lock)
		switch (cmd) {
		case "leftmargin":
		case "pagescale":
		case "print-leftmargin":
		case "scale":
			set_posx()
			break
		}
		return
	}
	set_format(cmd, param, lock)
}

// treat the %%beginxxx / %%endxxx sequences
function do_begin_end(type,
			opt,
			text) {
	var i, j, action, s

	switch (type) {
	default:
//	case "ps":
		if (typeof wpsobj == 'object') {
			wpsobj.parse(text);
			output.push(svgbuf)
		}
		break
	case "js":
		eval(text)
		break
	case "ml":
		if (parse.state >= 2) {
			s = new_block(type);
			s.text = text
		} else {
			svg_flush();
			user.img_out(text)
		}
		break
	case "svg":
		j = 0
		while (1) {
			i = text.indexOf('<style type="text/css">\n', j)
			if (i >= 0) {
				j = text.indexOf('</style>', i)
				if (j < 0) {
					syntax(1, "No </style> in %%beginsvg sequence")
					break
				}
				style += text.slice(i + 23, j)
				continue
			}
			i = text.indexOf('<defs>', j)
			if (i >= 0) {
				j = text.indexOf('</defs>', i)
				if (j < 0) {
					syntax(1, "No </defs> in %%beginsvg sequence")
					break
				}
				defs_add(text.slice(i + 6, j))
				continue
			}
			break
		}
		break
	case "text":
		action = get_textopt(opt);
		if (parse.state >= 2) {
			s = new_block(type);
			s.text = cnv_escape(text);
			s.opt = get_textopt(opt)
			break
		}
		write_text(cnv_escape(text), action)
		break
	}
}

/* -- generate a piece of tune -- */
function generate() {
	var v, p_voice;

	if (voice_tb.length == 0)
		return
	voice_adj();
	dupl_voice();
	sort_all()			/* define the time / vertical sequences */
	if (!tsfirst)
		return
	set_bar_num()
	if (!tsfirst)
		return				/* no more symbol */

	// give the parser result to the application
	if (user.get_abcmodel)
		user.get_abcmodel(tsfirst, voice_tb, anno_type, info)

	if (!user.img_out)
		return			// no SVG generation

	output_music()

	/* reset the parser */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		p_voice.time = 0;
		p_voice.sym = p_voice.last_sym = null;
		p_voice.st = cur_sy.voices[v].st;
		p_voice.second = cur_sy.voices[v].second;
//		p_voice.clef.time = 0;
		delete p_voice.have_ly;
		p_voice.hy_st = 0;
		delete p_voice.bar_start
		delete p_voice.slur_st
		delete p_voice.s_tie
		delete p_voice.s_rtie
	}
	staves_found = 0			// (for compress/dup the voices)
}

// transpose a key
//fixme: transpose of the accidental list is not done
function key_transp(s_key) {
	var	t = (curvoice.vtransp / 3) | 0,
		sf = (t & ~1) + (t & 1) * 7 + s_key.k_sf

	switch ((curvoice.vtransp + 210) % 3) {
	case 1:
		sf = (sf + 4 + 12 * 4) % 12 - 4	/* more sharps */
		break
	case 2:
		sf = (sf + 7 + 12 * 4) % 12 - 7	/* more flats */
		break
	default:
		sf = (sf + 5 + 12 * 4) % 12 - 5	/* Db, F# or B */
		break
	}
	s_key.k_sf = sf
}

/* -- set the accidentals when K: with modified accidentals -- */
function set_k_acc(s) {
	var i, j, n, nacc, p_acc,
		accs = [],
		pits = []

	if (s.k_sf > 0) {
		for (nacc = 0; nacc < s.k_sf; nacc++) {
			accs[nacc] = 1;			// sharp
			pits[nacc] = [26, 23, 27, 24, 21, 25, 22][nacc]
		}
	} else {
		for (nacc = 0; nacc < -s.k_sf; nacc++) {
			accs[nacc] = -1;		// flat
			pits[nacc] = [22, 25, 21, 24, 20, 23, 26][nacc]
		}
	}
	n = s.k_a_acc.length
	for (i = 0; i < n; i++) {
		p_acc = s.k_a_acc[i]
		for (j = 0; j < nacc; j++) {
			if (pits[j] == p_acc.pit) {
				accs[j] = p_acc.acc
				break
			}
		}
		if (j == nacc) {
			accs[j] = p_acc.acc;
			pits[j] = p_acc.pit
			nacc++		/* cannot overflow */
		}
	}
	for (i = 0; i < nacc; i++) {
		p_acc = s.k_a_acc[i]
		if (!p_acc)
			p_acc = s.k_a_acc[i] = {}
		p_acc.acc = accs[i];
		p_acc.pit = pits[i]
	}
}

/*
 * for transpose purpose, check if a pitch is already in the measure or
 * if it is tied from a previous note, and return the associated accidental
 */
function acc_same_pitch(pitch) {
	var	i, time,
		s = curvoice.last_sym.prev

	// the overlaid voices may have no measure bars
//	if (curvoice.id[curvoice.id.length - 1] == 'o') {
//		for (i = curvoice.v; --i > 0; )
//			if (!voice_tb[i].second)
//				break
//		s = voice_tb[i].last_sym
//	}

	if (!s)
		return //undefined;

	time = s.time

	for (; s; s = s.prev) {
		switch (s.type) {
		case BAR:
			if (s.time < time)
				return //undefined // no same pitch
			while (1) {
				s = s.prev
				if (!s)
					return //undefined
				if (s.type == NOTE) {
					if (s.time + s.dur == time)
						break
					return //undefined
				}
				if (s.time < time)
					return //undefined
			}
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].pit == pitch
				 && s.notes[i].ti1)
					return s.notes[i].acc
			}
			return //undefined
		case NOTE:
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].pit == pitch)
					return s.notes[i].acc
			}
			break
		}
	}
	return //undefined
}

/* -- get staves definition (%%staves / %%score) -- */
function get_staves(cmd, parm) {
	var	s, p_voice, p_voice2, i, flags, v, vid,
		st, range,
		a_vf = parse_staves(parm) // array of [vid, flags]

	if (!a_vf)
		return

	if (voice_tb.length != 0) {
		voice_adj();
		dupl_voice()
	}

	/* create a new staff system */
	var	maxtime = 0,
		no_sym = true

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.time > maxtime)
			maxtime = p_voice.time
		if (p_voice.sym)
			no_sym = false
	}
	if (no_sym				/* if first %%staves */
	 || (maxtime == 0 && staves_found < 0)) {
		for (v = 0; v < par_sy.voices.length; v++)
			par_sy.voices[v].range = -1
	} else {

		/*
		 * create a new staff system and
		 * link the 'staves' symbol in a voice which is seen from
		 * the previous system - see sort_all
		 */
		for (v = 0; v < par_sy.voices.length; v++) {
			if (par_sy.voices[v].range >= 0) {
				curvoice = voice_tb[v]
				break
			}
		}
		curvoice.time = maxtime;
		s = {
			type: STAVES,
			dur: 0
		}

		// put the staves before a measure bar (see draw_bar())
		var s2 = curvoice.last_sym
		if (s2 && s2.type == BAR && s2.time == maxtime) {
			curvoice.last_sym = s2.prev
			if (!s2.prev)
				curvoice.sym = s2.prev;	// null
			sym_link(s);
			s.next = s2;
			s2.prev = s;
			curvoice.last_sym = s2
			if (s2.eoln) {
				s.eoln = true;
				delete s2.eoln
			}
		} else {
			sym_link(s)	// link the staves in this voice
		}
		par_sy.nstaff = nstaff;
		new_syst();
		s.sy = par_sy
	}

//	staves_found = maxtime < 0 ? 0 : maxtime
	staves_found = maxtime

	/* initialize the (old) voices */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		delete p_voice.second
		delete p_voice.ignore
		delete p_voice.floating
//		p_voice.time = maxtime
	}
	range = 0
	for (i = 0; i < a_vf.length; i++) {
		vid = a_vf[i][0];
		p_voice = new_voice(vid);
		p_voice.time = maxtime;
		v = p_voice.v
		if (i == 0)
			par_sy.top_voice = p_voice.v

		// if the voice is already here, clone it
		if (par_sy.voices[v].range >= 0) {
			p_voice2 = clone(p_voice);
			par_sy.voices[voice_tb.length] = clone(par_sy.voices[v]);
			v = voice_tb.length;
			p_voice2.v = v;
			p_voice2.sym = p_voice2.last_sym = null;
			p_voice2.time = maxtime;
			voice_tb.push(p_voice2)
			delete p_voice2.clone
			while (p_voice.clone)
				p_voice = p_voice.clone;
			p_voice.clone = p_voice2;
			p_voice = p_voice2
		}
		a_vf[i][0] = p_voice;
		par_sy.voices[v].range = range++
	}

	/* change the behavior from %%staves to %%score */
	if (cmd[1] == 't') {				/* if %%staves */
		for (i = 0; i < a_vf.length; i++) {
			flags = a_vf[i][1]
			if (!(flags & (OPEN_BRACE | OPEN_BRACE2)))
				continue
			if ((flags & (OPEN_BRACE | CLOSE_BRACE))
					== (OPEN_BRACE | CLOSE_BRACE)
			 || (flags & (OPEN_BRACE2 | CLOSE_BRACE2))
					== (OPEN_BRACE2 | CLOSE_BRACE2))
				continue
			if (a_vf[i + 1][1] != 0)
				continue
			if ((flags & OPEN_PARENTH)
			 || (a_vf[i + 2][1] & OPEN_PARENTH))
				continue

			/* {a b c} -> {a *b c} */
			if (a_vf[i + 2][1] & (CLOSE_BRACE | CLOSE_BRACE2)) {
				a_vf[i + 1][1] |= FL_VOICE

			/* {a b c d} -> {(a b) (c d)} */
			} else if (a_vf[i + 2][1] == 0
				&& (a_vf[i + 3][1]
					& (CLOSE_BRACE | CLOSE_BRACE2))) {
				a_vf[i][1] |= OPEN_PARENTH;
				a_vf[i + 1][1] |= CLOSE_PARENTH;
				a_vf[i + 2][1] |= OPEN_PARENTH;
				a_vf[i + 3][1] |= CLOSE_PARENTH
			}
		}
	}

	/* set the staff system */
	st = -1
	for (i = 0; i < a_vf.length; i++) {
		flags = a_vf[i][1]
		if ((flags & (OPEN_PARENTH | CLOSE_PARENTH))
				== (OPEN_PARENTH | CLOSE_PARENTH)) {
			flags &= ~(OPEN_PARENTH | CLOSE_PARENTH);
			a_vf[i][1] = flags
		}
		p_voice = a_vf[i][0]
		if (flags & FL_VOICE) {
			p_voice.floating = true;
			p_voice.second = true
		} else {
			st++;
			if (!par_sy.staves[st]) {
				par_sy.staves[st] = {
					stafflines: '|||||',
					staffscale: 1
				}
			}
			par_sy.staves[st].flags = 0
		}
		v = p_voice.v;
		p_voice.st = p_voice.cst =
				par_sy.voices[v].st = st;
		par_sy.staves[st].flags |= flags
		if (flags & OPEN_PARENTH) {
			p_voice2 = p_voice
			while (i < a_vf.length - 1) {
				p_voice = a_vf[++i][0];
				v = p_voice.v
				if (a_vf[i][1] & MASTER_VOICE) {
					p_voice2.second = true
					p_voice2 = p_voice
				} else {
					p_voice.second = true;
				}
				p_voice.st = p_voice.cst
						= par_sy.voices[v].st
						= st
				if (a_vf[i][1] & CLOSE_PARENTH)
					break
			}
			par_sy.staves[st].flags |= a_vf[i][1]
		}
	}
	if (st < 0)
		st = 0
	par_sy.nstaff = nstaff = st

	/* change the behaviour of '|' in %%score */
	if (cmd[1] == 'c') {				/* if %%score */
		for (st = 0; st < nstaff; st++)
			par_sy.staves[st].flags ^= STOP_BAR
	}

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (par_sy.voices[v].range < 0) {
			p_voice.ignore = true
			continue
		}
		par_sy.voices[v].second = p_voice.second;
//		par_sy.voices[v].clef = p_voice.clef;
		st = p_voice.st
		if (st > 0 && !p_voice.norepbra
		 && !(par_sy.staves[st - 1].flags & STOP_BAR))
			p_voice.norepbra = true
//		par_sy.staves[st].clef = p_voice.clef
	}

	if (parse.state >= 2)
		curvoice = voice_tb[par_sy.top_voice]
	else
		curvoice = null
}

var err_no_strt_ov = "No note in voice overlay"

/* -- get a voice overlay -- */
function get_vover(type) {
	var	p_voice2, p_voice3, range, s, time, v, v2, v3,
		line = parse.line

	// get a voice or create a clone of the current voice
	function clone_voice(id) {
		var v, p_voice

		for (v = 0; v < voice_tb.length; v++) {
			p_voice = voice_tb[v]
			if (p_voice.id == id)
				return p_voice		// found
		}
		p_voice = clone(curvoice);
		p_voice.v = voice_tb.length;
		p_voice.id = id;
		p_voice.sym = p_voice.last_sym = null;

		p_voice.nm = null;
		p_voice.snm = null;
		p_voice.new_name = false;
		p_voice.lyric_restart = p_voice.lyric_restart =
			p_voice.lyric_cont = p_voice.ly_a_h = null;

		voice_tb.push(p_voice)
		return p_voice
	} // clone_voice()

	/* treat the end of overlay */
	if (curvoice.ignore)
		return
	if (type == '|'
	 || type == ')')  {
		if (!curvoice.last_note) {
			syntax(1, err_no_strt_ov)
			return
		}
		curvoice.last_note.beam_end = true
		if (!vover) {
			syntax(1, "Erroneous end of voice overlap")
			return
		}
		if (curvoice.time != vover.mxtime)
			syntax(1, "Wrong duration in voice overlay");
		curvoice = vover.p_voice;
		vover = null
		return
	}

	/* treat the full overlay start */
	if (type == '(') {
		if (vover) {
			syntax(1, "Voice overlay already started")
			return
		}
		vover = {			// no voice yet
			time: curvoice.time
		}
		return
	}

	/* (here is treated a new overlay - '&') */
	/* create the extra voice if not done yet */
	if (!curvoice.last_note) {
		syntax(1, err_no_strt_ov)
		return
	}
//--fixme?
//	curvoice.last_sym.beam_end = true
	curvoice.last_note.beam_end = true;
	p_voice2 = curvoice.voice_down
	if (!p_voice2) {
		p_voice2 = clone_voice(curvoice.id + 'o');
//		p_voice2.voice_up = curvoice;
		curvoice.voice_down = p_voice2;
		p_voice2.time = 0;
		p_voice2.second = true;
		v2 = p_voice2.v;
		par_sy.voices[v2] = {
			st: curvoice.st,
			second: true,
			scale: curvoice.scale,
			key: curvoice.key,
			ckey: curvoice.ckey,
			okey: curvoice.okey,
			pos: p_voice2.pos
		}
		var f_clone = curvoice.clone != undefined ? 1 : 0;
		range = par_sy.voices[curvoice.v].range
		for (v = 0; v < par_sy.voices.length; v++) {
			if (par_sy.voices[v].range > range)
				par_sy.voices[v].range += f_clone + 1
		}
		par_sy.voices[v2].range = range + 1
		if (f_clone) {
			p_voice3 = clone_voice(p_voice2.id + 'c');
			p_voice3.second = true;
			v3 = p_voice3.v;
			par_sy.voices[v3] = {
				second: true,
				scale: curvoice.clone.scale,
				range: range + 2
			}
			p_voice2.clone = p_voice3
		}
	}
//--fixme: in abcparse.c curvoice ulen and microscale are forced here
	p_voice2.ulen = curvoice.ulen
	p_voice2.dur_fact = curvoice.dur_fact
	if (curvoice.uscale)
		p_voice2.uscale = curvoice.uscale
//--fixme:, but not the scale, pos...
	
//	v = curvoice.v
//	v2 = p_voice2.v
//	p_voice2.cst = p_voice2.st = par_sy.voices[v2].st
//			= par_sy.voices[v].st
//	p_voice3 = p_voice2.clone
//	if (p_voice3) {
//		p_voice3.cst = p_voice3.st
//				= par_sy.voices[p_voice3.v].st
//				= par_sy.voices[curvoice.clone.v].st
//	}

	if (!vover) {				/* first '&' in a measure */
		vover = {
			bar: true,
			mxtime: curvoice.time,
			p_voice: curvoice
		}
		time = p_voice2.time
		for (s = curvoice.last_sym; /*s*/; s = s.prev) {
			if (s.type == BAR
			 || s.time <= time)	/* (if start of tune) */
				break
		}
		vover.time = s.time
	} else {
		if (!vover.p_voice) {		// first '&' in '(&' sequence
			vover.mxtime = curvoice.time;
			vover.p_voice = curvoice
		} else if (curvoice.time != vover.mxtime) {
			syntax(1, "Wrong duration in voice overlay")
		}
	}
	p_voice2.time = vover.time;
	curvoice = p_voice2
}

// check if a clef, key or time signature may go at start of the current voice
function is_voice_sig() {
	var s

	if (!curvoice.sym)
		return true	// new voice (may appear in the middle of a tune)
	if (curvoice.time != 0)
		return false
	for (s = curvoice.sym; s; s = s.next) {
		switch (s.type) {
		case TEMPO:
		case PART:
			break
		default:
			return false
		}
	}
	return true
}

// treat a clef found in the tune body
function get_clef(s) {
	var	s2, s3

	if (is_voice_sig()) {
		curvoice.clef = s
		return
	}

	// clef change
	/* the clef must appear before a key signature or a bar */
	s2 = curvoice.last_sym
	if (s2 && s2.prev
	 && s2.time == curvoice.time		// if no time skip
	 && ((s2.type == KEY && !s2.k_none) || s2.type == BAR)) {
		for (s3 = s2; s3.prev; s3 = s3.prev) {
			switch (s3.prev.type) {
			case KEY:
			case BAR:
				continue
			}
			break
		}
		curvoice.last_sym = s3.prev;
		sym_link(s);
		s.next = s3;
		s3.prev = s;
		curvoice.last_sym = s2
	} else {
		sym_link(s)
	}
	s.clef_small = true
}

// treat K: (kp = key signature + parameters)
function get_key(parm) {
	var	v, p_voice, s, transp,
//		[s_key, a] = new_key(parm)	// KO with nodejs
		a = new_key(parm),
		s_key = a[0];

	a = a[1]
	if (s_key.k_sf
	 && !s_key.k_exp
	 && s_key.k_a_acc)
		set_k_acc(s_key)

	switch (parse.state) {
	case 1:				// in tune header (first K:)
		if (s_key.k_sf == undefined && !s_key.k_a_acc) { // empty K:
			s_key.k_sf = 0;
			s_key.k_none = true
		}
		for (v = 0; v < voice_tb.length; v++) {
			p_voice = voice_tb[v];
			p_voice.key = s_key;
			p_voice.okey = clone(s_key);
			p_voice.ckey = clone(s_key)
//			if (s_key.k_none)
//				p_voice.key.k_sf = 0
		}
		parse.okey = clone(s_key);
		parse.ckey = s_key
		if (a.length != 0)
			memo_kv_parm('*', a)
		if (!glovar.ulen)
			glovar.ulen = BASE_LEN / 8;
		parse.state = 2;		// in tune header after K:

		write_heading();
		reset_gen();
		gene.nbar = cfmt.measurefirst	// measure numbering
		return
	case 2:					// K: at start of tune body
		goto_tune(true)
		break
	}
	if (a.length != 0)
		set_kv_parm(a);

	transp = (cfmt.transp || 0) +
		(curvoice.transp || 0) +
		(curvoice.shift || 0)

	if (s_key.k_sf == undefined) {
		if (!s_key.k_a_acc
		 && !transp)
			return
		s_key.k_sf = curvoice.okey.k_sf
	}

	curvoice.okey = clone(s_key)
	if (transp) {
		curvoice.vtransp = transp;
		key_transp(s_key)
	}

	s_key.k_old_sf = curvoice.ckey.k_sf;	// memorize the key changes

	curvoice.ckey = s_key

	if (is_voice_sig()) {
//		if (s_key.k_sf != undefined || s_key.k_a_acc) {
//			curvoice.ckey = s_key;
			curvoice.key = clone(s_key)
			if (s_key.k_none)
				curvoice.key.k_sf = 0
//		}
		return
	}

	/* the key signature must appear before a time signature */
	s = curvoice.last_sym
	if (s && s.type == METER) {
		curvoice.last_sym = s.prev
		if (!curvoice.last_sym)
			curvoice.sym = null;
		sym_link(s_key);
		s_key.next = s;
		s.prev = s_key;
		curvoice.last_sym = s
	} else {
		sym_link(s_key)
	}
}

// get / create a new voice
function new_voice(id) {
	var	p_voice, v, p_v_sav,
		n = voice_tb.length

	// if first explicit voice and no symbol, replace the default V:1
	if (n == 1
	 && voice_tb[0].default) {
		voice_tb[0].default = false
		if (!voice_tb[0].last_sym) {
			p_voice = voice_tb[0];
			p_voice.id = id
			if (cfmt.transp	// != undefined
			 && parse.state >= 2) {
				p_v_sav = curvoice;
				curvoice = p_voice;
				set_transp();
				curvoice = p_v_sav
			}
			return p_voice		// default voice
		}
	}
	for (v = 0; v < n; v++) {
		p_voice = voice_tb[v]
		if (p_voice.id == id)
			return p_voice		// old voice
	}

	p_voice = {
		v: v,
		id: id,
//		time: 0,	// used to know if new voice
		pos: {
			dyn: 0,
			gch: 0,
			gst: 0,
			orn: 0,
			stm: 0,
			voc: 0,
			vol: 0
		},
		scale: 1,
		combine: 0,
//		st: 0,
//		cst: 0,
		ulen: glovar.ulen,
		dur_fact: 1,
		key: clone(parse.ckey),
		ckey: clone(parse.ckey),
		okey: clone(parse.okey),
		meter: clone(glovar.meter),
		wmeasure: glovar.meter.wmeasure,
		clef: {
			type: CLEF,
			clef_auto: true,
			clef_type: "a",		// auto
			time: 0
		},
		hy_st: 0,
		instr: glovar.instr || 0	// MIDI instrument
	}

	voice_tb.push(p_voice);

	par_sy.voices[v] = {
		range: -1
	}

	return p_voice
}

// this function is called at program start and on end of tune
function init_tune() {
	nstaff = -1;
	voice_tb = [];
	curvoice = null;
	new_syst(true);
	staves_found = -1;
	gene = {}
}

// treat a 'V:' info
function get_voice(parm) {
	var	v, transp, vtransp,
		a = info_split(parm, 1),
		vid = a.shift();

	if (parse.state < 2) {
		if (a.length != 0)
			memo_kv_parm(vid, a)
		if (vid != '*' && parse.state == 1)
			new_voice(vid)
		return
	}

	curvoice = new_voice(vid);
	set_kv_parm(a)
	if (parse.state == 2)			// if first voice
		goto_tune();
	set_transp();

	v = curvoice.v
	if (curvoice.time == undefined) {	// if new voice
		curvoice.time = 0
		if (staves_found < 0) {		// if no %%score/%%staves
			curvoice.st = curvoice.cst = ++nstaff;
			par_sy.nstaff = nstaff;
			par_sy.voices[v].st = nstaff;
			par_sy.voices[v].range = v;
			par_sy.staves[nstaff] = {
				stafflines: "|||||",
				staffscale: 1
			}
		}
	
		if (par_sy.voices[v].range < 0) {
//			if (cfmt.alignbars)
//				syntax(1, "V: does not work with %%alignbars")
			if (staves_found >= 0)
				curvoice.ignore = true
		}
	}

	if (!curvoice.filtered
	 && !curvoice.ignore
	 && parse.voice_opts) {
		curvoice.filtered = true;
		voice_filter()
	}
}

// change state from 'tune header after K:' to 'in tune body'
// curvoice is defined when called from get_voice()
function goto_tune(is_K) {
	var	v, p_voice, transp,
		s = {
			type: STAVES,
			dur: 0,
			sy: par_sy
		}

	parse.state = 3;			// in tune body

	// if no voice yet, create the default voice
	if (voice_tb.length == 0) {
		curvoice = new_voice("1");
		curvoice.clef.istart = curvoice.key.istart;
		curvoice.clef.iend = curvoice.key.iend;
//		nstaff = 0;
//		curvoice.time = 0;
		curvoice.default = true
	} else if (!curvoice) {
		curvoice = voice_tb[staves_found < 0 ? 0 : par_sy.top_voice]
	}

	if (!curvoice.init && !is_K) {
		set_kv_parm([]);
		set_transp()
	}

	// update some voice parameters
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		p_voice.ulen = glovar.ulen
		if (p_voice.key.k_bagpipe
		 && !p_voice.pos.stm) {
			p_voice.pos = clone(p_voice.pos);
			p_voice.pos.stm = SL_BELOW
		}
//		if (p_voice.key.k_none)
//			p_voice.key.k_sf = 0
	}

	// initialize the voices when no %%staves/score	
	if (staves_found < 0) {
		nstaff = voice_tb.length - 1
		for (v = 0; v <= nstaff; v++) {
			p_voice = voice_tb[v];
			p_voice.time = 0;		// old voice
			p_voice.clef.time = 0
			p_voice.st = p_voice.cst =
				par_sy.voices[v].st =
					par_sy.voices[v].range = v;
			par_sy.staves[v] = {
				stafflines: '|||||',
				staffscale: 1
			}
		}
		par_sy.nstaff = nstaff
	}

	// link the first %%score in the top voice
	p_voice = curvoice;
	curvoice = voice_tb[par_sy.top_voice];
	sym_link(s)
	if (staves_found < 0)
		s.default = true;
	curvoice = p_voice
}
