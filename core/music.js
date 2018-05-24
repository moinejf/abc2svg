// abc2svg - music.js - music generation
//
// Copyright (C) 2014-2018 Jean-Francois Moine
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

var	gene,
	staff_tb,
	nstaff,			// current number of staves
	tsnext,			// next line when cut
	realwidth,		// real staff width while generating
	insert_meter,		// insert time signature (1) and indent 1st line (2)
	beta_last,		// for last short short line..

/* width of notes indexed by log2(note_length) */
	space_tb = new Float32Array([
		7, 10, 14.15, 20, 28.3,
		40,			/* crotchet (whole note / 4) */
		56.6, 80, 100, 120
	]),
	smallest_duration

/* -- decide whether to shift heads to other side of stem on chords -- */
/* this routine is called only once per tune */

// distance for no overlap - index: [prev acc][cur acc]
//var dt_tb = [
//	[5, 5, 5, 5],		/* dble sharp */
//	[5, 6, 6, 6],		/* sharp */
//	[5, 6, 5, 6],		/* natural */
//	[5, 5, 5, 5]		/* flat / dble flat */
//]

// accidental x offset - index = note head type
var dx_tb = new Float32Array([
	10,		// FULL
	10,		// EMPTY
	11,		// OVAL
	13,		// OVALBARS
	13		// SQUARE
])

// head width  - index = note head type
var hw_tb = new Float32Array([
	4.5,		// FULL
	5,		// EMPTY
	6,		// OVAL
	7,		// OVALBARS
	8		// SQUARE
])

/* head width for voice overlap - index = note head type */
var w_note = new Float32Array([
	3.5,		// FULL
	3.7,		// EMPTY
	5,		// OVAL
	6,		// OVALBARS
	7		// SQUARE
])

function set_head_shift(s) {
	var	i, i1, i2, d, ps, dx,
		dx_head = dx_tb[s.head],
		dir = s.stem,
		n = s.nhd

	if (n == 0)
		return			// single note

	/* set the head shifts */
	dx = dx_head * .78
	if (s.grace)
		dx *= .5
	if (dir >= 0) {
		i1 = 1;
		i2 = n + 1;
		ps = s.notes[0].pit
	} else {
		dx = -dx;
		i1 = n - 1;
		i2 = -1;
		ps = s.notes[n].pit
	}
	var	shift = false,
		dx_max = 0
	for (i = i1; i != i2; i += dir) {
		d = s.notes[i].pit - ps;
		ps = s.notes[i].pit
		if (d == 0) {
			if (shift) {		/* unison on shifted note */
				var new_dx = s.notes[i].shhd =
						s.notes[i - dir].shhd + dx
				if (dx_max < new_dx)
					dx_max = new_dx
				continue
			}
			if (i + dir != i2	/* second after unison */
//fixme: should handle many unisons after second
			 && ps + dir == s.notes[i + dir].pit) {
				s.notes[i].shhd = -dx
				if (dx_max < -dx)
					dx_max = -dx
				continue
			}
		}
		if (d < 0)
			d = -d
		if (d > 3 || (d >= 2 && s.head != SQUARE)) {
			shift = false
		} else {
			shift = !shift
			if (shift) {
				s.notes[i].shhd = dx
				if (dx_max < dx)
					dx_max = dx
			}
		}
	}
	s.xmx = dx_max				/* shift the dots */
}

// set the accidental shifts for a set of chords
function acc_shift(notes, dx_head) {
	var	i, i1, dx, dx1, ps, p1, acc,
		n = notes.length

	// set the shifts from the head shifts
	for (i = n - 1; --i >= 0; ) {	// (no shift on top)
		dx = notes[i].shhd
		if (!dx || dx > 0)
			continue
		dx = dx_head - dx;
		ps = notes[i].pit
		for (i1 = n; --i1 >= 0; ) {
			if (!notes[i1].acc)
				continue
			p1 = notes[i1].pit
			if (p1 < ps - 3)
				break
			if (p1 > ps + 3)
				continue
			if (notes[i1].shac < dx)
				notes[i1].shac = dx
		}
	}

	// set the shifts from accidental shifts
	for (i = n; --i >= 0; ) {		// from top to bottom
		acc = notes[i].acc
		if (!acc)
			continue
		dx = notes[i].shac
		if (!dx) {
			dx = notes[i].shhd
			if (dx < 0)
				dx = dx_head - dx
			else
				dx = dx_head
		}
		ps = notes[i].pit
		for (i1 = n; --i1 > i; ) {
			if (!notes[i1].acc)
				continue
			p1 = notes[i1].pit
			if (p1 >= ps + 4) {	// pitch far enough
				if (p1 > ps + 4	// if more than a fifth
				 || acc < 0	// if flat/dble flat
				 || notes[i1].acc < 0)
					continue
			}
			if (dx > notes[i1].shac - 6) {
				dx1 = notes[i1].shac + 7
				if (dx1 > dx)
					dx = dx1
			}
		}
		notes[i].shac = dx
	}
}

/* set the horizontal shift of accidentals */
/* this routine is called only once per tune */
function set_acc_shft() {
	var s, s2, st, i, acc, st, t, dx_head;

	// search the notes with accidentals at the same time
	s = tsfirst
	while (s) {
		if (s.type != NOTE
		 || s.invis) {
			s = s.ts_next
			continue
		}
		st = s.st;
		t = s.time;
		acc = false
		for (s2 = s; s2; s2 = s2.ts_next) {
			if (s2.time != t
			 || s2.type != NOTE
			 || s2.st != st)
				break
			if (acc)
				continue
			for (i = 0; i <= s2.nhd; i++) {
				if (s2.notes[i].acc) {
					acc = true
					break
				}
			}
		}
		if (!acc) {
			s = s2
			continue
		}

		dx_head = dx_tb[s.head]
//		if (s.dur >= BASE_LEN * 2 && s.head == OVAL)
//		if (s.dur >= BASE_LEN * 2)
//			dx_head = 15.8;

		// build a pseudo chord and shift the accidentals
		st = {
			notes: []
		}
		for ( ; s != s2; s = s.ts_next)
			st.notes = st.notes.concat(s.notes);
		sort_pitch(st);
		acc_shift(st.notes, dx_head)
	}
}

// link a symbol before an other one
function lkvsym(s, next) {	// voice linkage
	s.next = next;
	s.prev = next.prev
	if (s.prev)
		s.prev.next = s
	else
		s.p_v.sym = s;
	next.prev = s
}
function lktsym(s, next) {	// time linkage
	if (next) {
		s.ts_next = next;
		s.ts_prev = next.ts_prev
		if (s.ts_prev)
			s.ts_prev.ts_next = s;
		next.ts_prev = s
	} else {
		s.ts_next = s.ts_prev = null
	}
}

/* -- unlink a symbol -- */
function unlksym(s) {
	if (s.next)
		s.next.prev = s.prev
	if (s.prev)
		s.prev.next = s.next
	else
		s.p_v.sym = s.next
	if (s.ts_next) {
		if (s.seqst && !s.ts_next.seqst) {
			s.ts_next.seqst = true;
			s.ts_next.shrink = s.shrink;
			s.ts_next.space = s.space
		}
		s.ts_next.ts_prev = s.ts_prev
	}
	if (s.ts_prev)
		s.ts_prev.ts_next = s.ts_next
	if (tsfirst == s)
		tsfirst = s.ts_next
	if (tsnext == s)
		tsnext = s.ts_next
}

/* -- insert a clef change (treble or bass) before a symbol -- */
function insert_clef(s, clef_type, clef_line) {
	var	p_voice = s.p_v,
		new_s,
		st = s.st

	/* don't insert the clef between two bars */
	if (s.type == BAR && s.prev && s.prev.type == BAR)
		s = s.prev;

	/* create the symbol */
	p_voice.last_sym = s.prev
	if (!p_voice.last_sym)
		p_voice.sym = null;
	p_voice.time = s.time;
	new_s = sym_add(p_voice, CLEF);
	new_s.next = s;
	s.prev = new_s;

	new_s.clef_type = clef_type;
	new_s.clef_line = clef_line;
	new_s.st = st;
	new_s.clef_small = true
	delete new_s.second;
	new_s.notes = []
	new_s.notes[0] = {
		pit: s.notes[0].pit
	}
	new_s.nhd = 0;

	/* link in time */
	while (!s.seqst)
		s = s.ts_prev;
	lktsym(new_s, s)
	if (new_s.ts_prev.type != CLEF)
		new_s.seqst = true
	return new_s
}

/* -- set the staff of the floating voices -- */
/* this function is called only once per tune */
function set_float() {
	var p_voice, st, staff_chg, v, s, s1, up, down

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
//		if (!p_voice.floating)
//			continue
		staff_chg = false;
		st = p_voice.st
		for (s = p_voice.sym; s; s = s.next) {
			if (!s.floating) {
				while (s && !s.floating)
					s = s.next
				if (!s)
					break
				staff_chg = false
			}
			if (!s.dur) {
				if (staff_chg)
					s.st++
				continue
			}
			if (s.notes[0].pit >= 19) {		/* F */
				staff_chg = false
				continue
			}
			if (s.notes[s.nhd].pit <= 12) {	/* F, */
				staff_chg = true
				s.st++
				continue
			}
			up = 127
			for (s1 = s.ts_prev; s1; s1 = s1.ts_prev) {
				if (s1.st != st
				 || s1.v == s.v)
					break
				if (s1.type == NOTE)
				    if (s1.notes[0].pit < up)
					up = s1.notes[0].pit
			}
			if (up == 127) {
				if (staff_chg)
					s.st++
				continue
			}
			if (s.notes[s.nhd].pit > up - 3) {
				staff_chg = false
				continue
			}
			down = -127
			for (s1 = s.ts_next; s1; s1 = s1.ts_next) {
				if (s1.st != st + 1
				 || s1.v == s.v)
					break
				if (s1.type == NOTE)
				    if (s1.notes[s1.nhd].pit > down)
					down = s1.notes[s1.nhd].pit
			}
			if (down == -127) {
				if (staff_chg)
					s.st++
				continue
			}
			if (s.notes[0].pit < down + 3) {
				staff_chg = true
				s.st++
				continue
			}
			up -= s.notes[s.nhd].pit
			down = s.notes[0].pit - down
			if (!staff_chg) {
				if (up < down + 3)
					continue
				staff_chg = true
			} else {
				if (up < down - 3) {
					staff_chg = false
					continue
				}
			}
			s.st++
		}
	}
}

/* -- set the x offset of the grace notes -- */
function set_graceoffs(s) {
	var	next, m, dx,
		gspleft = Number(cfmt.gracespace[0]),
		gspinside = Number(cfmt.gracespace[1]),
		gspright = Number(cfmt.gracespace[2]),
		xx = 0,
		g = s.extra;

	g.beam_st = true
	for ( ; ; g = g.next) {
		set_head_shift(g)
		acc_shift(g.notes, 7);
		dx = 0
		for (m = g.nhd; m >= 0; m--) {
			if (g.notes[m].shac > dx)
				dx = g.notes[m].shac
		}
		xx += dx;
		g.x = xx

		if (g.nflags <= 0) {
			g.beam_st = true;
			g.beam_end = true
		}
		next = g.next
		if (!next) {
			g.beam_end = true
			break
		}
		if (next.nflags <= 0)
			g.beam_end = true
		if (g.beam_end) {
			next.beam_st = true;
			xx += gspinside / 4
		}
		if (g.nflags <= 0)
			xx += gspinside / 4
		if (g.y > next.y + 8)
			xx -= 1.5
		xx += gspinside
	}

	xx += gspleft + gspright;
	next = s.next
	if (next
	 && next.type == NOTE) {	/* if before a note */
		if (g.y >= 3 * (next.notes[next.nhd].pit - 18))
			xx -= 1		/* above, a bit closer */
		else if (g.beam_st
		      && g.y < 3 * (next.notes[0].pit - 18) - 7)
			xx += 2		/* below with flag, a bit further */
	}

	/* return the whole width */
	return xx
}

/* -- compute the width needed by the guitar chords / annotations -- */
function gchord_width(s, wlnote, wlw) {
	var	s2, gch, w, wl, ix,
		lspc = 0,
		rspc = 0,
		alspc = 0,
		arspc = 0

	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		switch (gch.type) {
		default:		/* default = above */
			wl = -gch.x
			if (wl > lspc)
				lspc = wl;
			w = gch.w + 2 - wl
			if (w > rspc)
				rspc = w
			break
		case '<':		/* left */
			w = gch.w + wlnote
			if (w > alspc)
				alspc = w
			break
		case '>':		/* right */
			w = gch.w + s.wr
			if (w > arspc)
				arspc = w
			break
		}
	}

	/* adjust width for no clash */
	s2 = s.prev
	if (s2) {
		if (s2.a_gch) {
			for (s2 = s.ts_prev; ; s2 = s2.ts_prev) {
				if (s2 == s.prev) {
					if (wlw < lspc)
						wlw = lspc
					break
				}
				if (s2.seqst)
					lspc -= s2.shrink
			}
		}
		if (alspc != 0)
			if (wlw < alspc)
				wlw = alspc
	}
	s2 = s.next
	if (s2) {
		if (s2.a_gch) {
			for (s2 = s.ts_next; ; s2 = s2.ts_next) {
				if (s2 == s.next) {
					if (s.wr < rspc)
						s.wr = rspc
					break
				}
				if (s2.seqst)
					rspc -= 8
			}
		}
		if (arspc != 0)
			if (s.wr < arspc)
				s.wr = alspc
	}
	return wlw
}

/* -- set the width of a symbol -- */
/* This routine sets the minimal left and right widths wl,wr
 * so that successive symbols are still separated when
 * no extra glue is put between them */
function set_width(s) {
	var s2, i, m, xx, w, wlnote, wlw, acc

	switch (s.type) {
	case NOTE:
	case REST:

		/* set the note widths */
		s.wr = wlnote = hw_tb[s.head]

		/* room for shifted heads and accidental signs */
		if (s.xmx > 0)
			s.wr += s.xmx + 4;
		for (s2 = s.prev; s2; s2 = s2.prev) {
			if (w_tb[s2.type] != 0)
				break
		}
		if (s2) {
			switch (s2.type) {
			case BAR:
			case CLEF:
			case KEY:
			case METER:
				wlnote += 3
				break
			}
		}
		for (m = 0; m <= s.nhd; m++) {
			xx = s.notes[m].shhd
			if (xx < 0) {
				if (wlnote < -xx + 5)
					wlnote = -xx + 5
			}
			if (s.notes[m].acc) {
				var tmp = s.notes[m].shac +
					(s.notes[m].micro ? 5.5 : 3.5)
				if (wlnote < tmp)
					wlnote = tmp
			}
		}
		if (s2) {
			switch (s2.type) {
			case BAR:
			case CLEF:
			case KEY:
			case METER:
				wlnote -= 3
				break
			}
		}

		/* room for the decorations */
		if (s.a_dd)
			wlnote += deco_width(s)

		/* space for flag if stem goes up on standalone note */
		if (s.beam_st && s.beam_end
		 && s.stem > 0 && s.nflags > 0) {
			if (s.wr < s.xmx + 9)
				s.wr = s.xmx + 9
		}

		/* leave room for dots and set their offset */
		if (s.dots > 0) {
		  if (s.wl == undefined)	// don't recompute if new music line
			switch (s.head) {
			case SQUARE:
				s.xmx += 4
				break
			case OVALBARS:
			case OVAL:
				s.xmx += 2
				break
			case EMPTY:
				s.xmx += 1
				break
			}
			if (s.wr < s.xmx + 8)
				s.wr = s.xmx + 8
			if (s.dots >= 2)
				s.wr += 3.5 * (s.dots - 1)
		}

		/* if a tremolo on 2 notes, have space for the small beam(s) */
		if (s.trem2 && s.beam_end
		 && wlnote < 20)
			wlnote = 20

		wlw = wlnote

		if (s2) {
			switch (s2.type) {
			case NOTE:	/* extra space when up stem - down stem */
				if (s2.stem > 0 && s.stem < 0) {
					if (wlw < 7)
						wlw = 7
				}

				/* make sure helper lines don't overlap */
				if ((s.y > 27 && s2.y > 27)
				 || (s.y < -3 && s2.y < -3)) {
					if (wlw < 6)
						wlw = 6
				}

				/* have ties wide enough */
				if (s2.ti1) {
					if (wlw < 14)
						wlw = 14
				}
				break
			case CLEF:		/* extra space at start of line */
				if (s2.second
				 || s2.clef_small)
					break
				wlw += 8
				break
			case KEY:
/*			case METER:	*/
				wlw += 4
				break
			}
		}

		/* leave room for guitar chord */
		if (s.a_gch)
			wlw = gchord_width(s, wlnote, wlw)

		/* leave room for vocals under note */
		/* related to draw_lyrics() */
		if (s.a_ly)
			wlw = ly_width(s, wlw)

		/* if preceeded by a grace note sequence, adjust */
		if (s2 && s2.type == GRACE)
			s.wl = wlnote - 4.5
		else
			s.wl = wlw
		return
	case SPACE:
		xx = s.width / 2;
		s.wr = xx
		if (s.a_gch)
			xx = gchord_width(s, xx, xx)
		if (s.a_dd)
			xx += deco_width(s);
		s.wl = xx
		return
	case BAR:
		if (s.norepbra)
			break
		if (!s.invis) {
			var bar_type = s.bar_type

			switch (bar_type) {
			case "|":
				w = 7		// 4 + 3
				break
			case "|:":
			case ":|":
				w = 15		// 4 + 5 + 6
				break
			case "::":
				w = 26		// 4 + 5 + 6 + 6 + 5
				break
			default:
				if (!bar_type)
					break
				w = 4 + 3 * bar_type.length
				for (i = 0; i < bar_type.length; i++) {
					switch (bar_type[i]) {
					case "[":
					case "]":
						w += 3
						break
					case ":":
						w += 2
						break
					}
				}
				break
			}
			s.wl = w
			if (s.next
			 && s.next.type != METER)
				s.wr = 7
			else
				s.wr = 5
//			s.notes[0].shhd = (w - 5) * -.5

			/* if preceeded by a grace note sequence, adjust */
			for (s2 = s.prev; s2; s2 = s2.prev) {
				if (w_tb[s2.type] != 0) {
					if (s2.type == GRACE)
						s.wl -= 8
					break
				}
			}
		} else {
			s.wl = s.wr = 0
		}
		if (s.a_dd)
			s.wl += deco_width(s)

		/* have room for the repeat numbers / chord indication */
		if (s.text && s.text.length < 4
		 && s.next && s.next.a_gch) {
			set_font("repeat");
			s.wr += strwh(s.text)[0] + 2
		}
		return
	case CLEF:
// (there may be invisible clefs in empty staves)
		if (s.invis) {
			s.wl = s.wr = 1		// (!! not 0 !!)
			return
		}
		s.wl = s.wr = s.clef_small ? 8 : 12
		return
	case KEY:
		var n1, n2, esp;

		s.wl = 3;
		esp = 4
		if (!s.k_a_acc) {
			n1 = s.k_sf			/* new key sig */
			if (s.k_old_sf && (cfmt.cancelkey || n1 == 0))
				n2 = s.k_old_sf	/* old key */
			else
				n2 = 0
			if (n1 * n2 >= 0) {		/* if no natural */
				if (n1 < 0)
					n1 = -n1
				if (n2 < 0)
					n2 = -n2
				if (n2 > n1)
					n1 = n2
			} else {
				n1 -= n2
				if (n1 < 0)
					n1 = -n1;
				esp += 3	/* see extra space in draw_keysig() */
			}
		} else {
			n1 = n2 = s.k_a_acc.length
			if (n2)
			    var	last_acc = s.k_a_acc[0].acc
			for (i = 1; i < n2; i++) {
				acc = s.k_a_acc[i]
				if (acc.pit > s.k_a_acc[i - 1].pit + 6
				 || acc.pit < s.k_a_acc[i - 1].pit - 6)
					n1--		// no clash
				else if (acc.acc != last_acc)
					esp += 3;
				last_acc = acc.acc
			}
		}
		s.wr = 5.5 * n1 + esp
		return
	case METER:
		wlw = 0;
		s.x_meter = []
		for (i = 0; i < s.a_meter.length; i++) {
			var meter = s.a_meter[i]
			if (meter.top[0] == "C") {
				s.x_meter[i] = wlw + 6;
				wlw += 12
			} else {
				w = 0
				if (!meter.bot
				 || meter.top.length > meter.bot.length)
					meter = meter.top
				else
					meter = meter.bot;
				for (m = 0; m < meter.length; m++) {
					switch (meter[m]) {
					case '(':
						wlw += 4
						// fall thru
					case ')':
					case '1':
						w += 4
						break
					default:
						w += 12
						break
					}
				}
				s.x_meter[i] = wlw + w / 2
				wlw += w
			}
		}
		s.wl = 0;
		s.wr = wlw + 6
		return
	case MREST:
		s.wl = 6;
		s.wr = 66
		return
	case GRACE:
		s.wl = set_graceoffs(s);
		s.wr = 0
		if (s.a_ly)
			ly_width(s, wlw)
		return
	case STBRK:
		s.wl = s.xmx
		if (s.next && s.next.type == CLEF) {
			s.wr = 2
			delete s.next.clef_small	/* big clef */
		} else {
			s.wr = 8
		}
		return
	case CUSTOS:
		s.wl = s.wr = 4
		return
	case BLOCK:				// no width
	case PART:
	case REMARK:
	case STAVES:
	case TEMPO:
		break
	default:
		error(2, s, "set_width - Cannot set width for symbol $1", s.type)
		break
	}
	s.wl = s.wr = 0
}

/* -- set the natural space -- */
function set_space(s) {
	var	s2, i, l, space,
		prev_time = s.ts_prev.time,
		len = s.time - prev_time		/* time skip */

	if (len == 0) {
		switch (s.type) {
		case MREST:
			return s.wl
///*fixme:do same thing at start of line*/
//		case NOTE:
//		case REST:
//			if (s.ts_prev.type == BAR) {
//				if (s.nflags < -2)
//					return space_tb[0]
//				return space_tb[2]
//			}
//			break
		}
		return 0
	}
	if (s.ts_prev.type == MREST)
//		return s.ts_prev.wr + 16
//				+ 3		// (bar wl=5 wr=8)
		return 71	// 66 (mrest.wl) + 5 (bar.wl)
	if (smallest_duration >= BASE_LEN / 2) {
		if (smallest_duration >= BASE_LEN)
			len /= 4
		else
			len /= 2
	} else if (!s.next && len >= BASE_LEN) {
		len /= 2
	}
	if (len >= BASE_LEN / 4) {
		if (len < BASE_LEN / 2)
			i = 5
		else if (len < BASE_LEN)
			i = 6
		else if (len < BASE_LEN * 2)
			i = 7
		else if (len < BASE_LEN * 4)
			i = 8
		else
			i = 9
	} else {
		if (len >= BASE_LEN / 8)
			i = 4
		else if (len >= BASE_LEN / 16)
			i = 3
		else if (len >= BASE_LEN / 32)
			i = 2
		else if (len >= BASE_LEN / 64)
			i = 1
		else
			i = 0
	}
	l = len - ((BASE_LEN / 16 / 8) << i)
	space = space_tb[i]
	if (l != 0) {
		if (l < 0) {
			space = space_tb[0] * len / (BASE_LEN / 16 / 8)
		} else {
			if (i >= 9)
				i = 8
			space += (space_tb[i + 1] - space_tb[i]) * l / len
		}
	}
	while (!s.dur) {
		switch (s.type) {
		case BAR:
			// (hack to have quite the same note widths between measures)
			return space * .9 - 7
		case CLEF:
			return space - s.wl - s.wr
		case BLOCK:			// no space
		case PART:
		case REMARK:
		case STAVES:
		case TEMPO:
			s = s.ts_next
			if (!s)
				return space
			continue
		}
		break
	}

	/* reduce spacing within a beam */
	if (!s.beam_st)
		space *= .9			// ex fnnp

	/* decrease spacing when stem down followed by stem up */
/*fixme:to be done later, after x computed in sym_glue*/
	if (s.type == NOTE && s.nflags >= -1
	 && s.stem > 0) {
		var stemdir = true

		for (s2 = s.ts_prev;
		     s2 && s2.time == prev_time;
		     s2 = s2.ts_prev) {
			if (s2.type == NOTE
			 && (s2.nflags < -1 || s2.stem > 0)) {
				stemdir = false
				break
			}
		}
		if (stemdir) {
			for (s2 = s.ts_next;
			     s2 && s2.time == s.time;
			     s2 = s2.ts_next) {
				if (s2.type == NOTE
				 && (s2.nflags < -1 || s2.stem < 0)) {
					stemdir = false
					break
				}
			}
			if (stemdir)
				space *= .9
		}
	}
	return space
}

// create an invisible bar for end of music lines
function add_end_bar(s) {
	return {
		type: BAR,
		bar_type: "|",
		ctx: s.ctx,
		istart: s.istart,
		iend: s.iend,
		v: s.v,
		p_v: s.p_v,
		st: s.st,
		dur: 0,
		seqst: true,
		invis: true,
		time: s.time + s.dur,
		nhd: 0,
		notes: [{
			pit: s.notes[0].pit
		}],
		wl:0,
		wr:0
	}
}

/* -- set the width and space of all symbols -- */
/* this function is called once for the whole tune
 * then, once per music line up to the first sequence */
function set_allsymwidth(last_s) {
	var	new_val,
		s = tsfirst,
		xa = 0,
		xl = []

	/* loop on all symbols */
	while (1) {
		var	maxx = xa,
			s2 = s

		do {
			set_width(s);
			new_val = (xl[s.st] || 0) + s.wl
			if (new_val > maxx)
				maxx = new_val;
			s = s.ts_next
		} while (s != last_s && !s.seqst);

		/* set the spaces at start of sequence */
		s2.shrink = maxx - xa
		if (s2.ts_prev)
			s2.space = set_space(s2)
		else
			s2.space = 0
		if (s2.shrink == 0 && s2.space == 0 && s2.type == CLEF) {
			delete s2.seqst;		/* no space */
			s2.time = s2.ts_prev.time
		}
		if (s == last_s)
			break

		// update the min left space per staff
		xa = maxx;
		s = s2
		do {
			if (!xl[s.st] || xl[s.st] < xa + s.wr)
				xl[s.st] = xa + s.wr;
			s = s.ts_next
		} while (!s.seqst)
	}
}

/* change a symbol into a rest */
function to_rest(s) {
	s.type = REST
// just keep nl and seqst
	delete s.in_tuplet
	delete s.sl1
	delete s.sl2
	delete s.a_dd
	delete s.a_gch
	s.slur_start = s.slur_end = 0
/*fixme: should set many parameters for set_width*/
//	set_width(s)
}

/* -- set the repeat sequences / measures -- */
function set_repeat(s) {	// first note
	var	s2, s3,  i, j, dur,
		n = s.repeat_n,
		k = s.repeat_k,
		st = s.st,
		v = s.v

	s.repeat_n = 0				// treated

	/* treat the sequence repeat */
	if (n < 0) {				/* number of notes / measures */
		n = -n;
		i = n				/* number of notes to repeat */
		for (s3 = s.prev; s3; s3 = s3.prev) {
			if (!s3.dur) {
				if (s3.type == BAR) {
					error(1, s3, "Bar in repeat sequence")
					return
				}
				continue
			}
			if (--i <= 0)
				break
		}
		if (!s3) {
			error(1, s, errs.not_enough_n)
			return
		}
		dur = s.time - s3.time;

		i = k * n		/* whole number of notes/rests to repeat */
		for (s2 = s; s2; s2 = s2.next) {
			if (!s2.dur) {
				if (s2.type == BAR) {
					error(1, s2, "Bar in repeat sequence")
					return
				}
				continue
			}
			if (--i <= 0)
				break
		}
		if (!s2
		 || !s2.next) {		/* should have some symbol */
			error(1, s, errs.not_enough_n)
			return
		}
		for (s2 = s.prev; s2 != s3; s2 = s2.prev) {
			if (s2.type == NOTE) {
				s2.beam_end = true
				break
			}
		}
		for (j = k; --j >= 0; ) {
			i = n			/* number of notes/rests */
			if (s.dur)
				i--;
			s2 = s.ts_next
			while (i > 0) {
				if (s2.st == st) {
					unlksym(s2)
					if (s2.v == v
					 && s2.dur)
						i--
				}
				s2 = s2.ts_next
			}
			to_rest(s);
			s.dur = s.notes[0].dur = dur;
			s.rep_nb = -1;		// single repeat
			s.beam_st = true;
			set_width(s)
			if (s.seqst)
				s.space = set_space(s);
			s.head = SQUARE;
			for (s = s2; s; s = s.ts_next) {
				if (s.st == st
				 && s.v == v
				 && s.dur)
					break
			}
		}
		return
	}

	/* check the measure repeat */
	i = n				/* number of measures to repeat */
	for (s2 = s.prev.prev ; s2; s2 = s2.prev) {
		if (s2.type == BAR
		 || s2.time == tsfirst.time) {
			if (--i <= 0)
				break
		}
	}
	if (!s2) {
		error(1, s, errs.not_enough_m)
		return
	}

	dur = s.time - s2.time		/* repeat duration */

	if (n == 1)
		i = k			/* repeat number */
	else
		i = n			/* check only 2 measures */
	for (s2 = s; s2; s2 = s2.next) {
		if (s2.type == BAR) {
			if (--i <= 0)
				break
		}
	}
	if (!s2) {
		error(1, s, errs.not_enough_m)
		return
	}

	/* if many 'repeat 2 measures'
	 * insert a new %%repeat after the next bar */
	i = k				/* repeat number */
	if (n == 2 && i > 1) {
		s2 = s2.next
		if (!s2) {
			error(1, s, errs.not_enough_m)
			return
		}
		s2.repeat_n = n;
		s2.repeat_k = --i
	}

	/* replace */
	dur /= n
	if (n == 2) {			/* repeat 2 measures (once) */
		s3 = s
		for (s2 = s.ts_next; ; s2 = s2.ts_next) {
			if (s2.st != st)
				continue
			if (s2.v == v
			 && s2.type == BAR)
				break
			unlksym(s2)
		}
		to_rest(s3);
		s3.dur = s3.notes[0].dur = dur;
		s3.invis = true
		if (s3.seqst)
			s3.space = set_space(s3);
		s2.bar_mrep = 2
		if (s2.seqst)
			s2.space = set_space(s2);
		s3 = s2.next;
		for (s2 = s3.ts_next; ; s2 = s2.ts_next) {
			if (s2.st != st)
				continue
			if (s2.v == v
			 && s2.type == BAR)
				break
			unlksym(s2)
		}
		to_rest(s3);
		s3.dur = s3.notes[0].dur = dur;
		s3.invis = true;
		set_width(s3)
		if (s3.seqst)
			s3.space = set_space(s3)
		if (s2.seqst)
			s2.space = set_space(s2)
		return
	}

	/* repeat 1 measure */
	s3 = s
	for (j = k; --j >= 0; ) {
		for (s2 = s3.ts_next; ; s2 = s2.ts_next) {
			if (s2.st != st)
				continue
			if (s2.v == v
			 && s2.type == BAR)
				break
			unlksym(s2)
		}
		to_rest(s3);
		s3.dur = s3.notes[0].dur = dur;
		s3.beam_st = true
		if (s3.seqst)
			s3.space = set_space(s3)
		if (s2.seqst)
			s2.space = set_space(s2)
		if (k == 1) {
			s3.rep_nb = 1
			break
		}
		s3.rep_nb = k - j + 1;	// number to print above the repeat rest
		s3 = s2.next
	}
}

/* add a custos before the symbol of the next line */
function custos_add(s) {
	var	p_voice, new_s, i,
		s2 = s

	while (1) {
		if (s2.type == NOTE)
			break
		s2 = s2.next
		if (!s2)
			return
	}

	p_voice = s.p_v;
	p_voice.last_sym = s.prev;
//	if (!p_voice.last_sym)
//		p_voice.sym = null;
	p_voice.time = s.time;
	new_s = sym_add(p_voice, CUSTOS);
	new_s.next = s;
	s.prev = new_s;
	lktsym(new_s, s);

	new_s.seqst = true;
	new_s.shrink = s.shrink
	if (new_s.shrink < 8 + 4)
		new_s.shrink = 8 + 4;
	new_s.space = s2.space;
	new_s.wl = 0;
	new_s.wr = 4;

	new_s.nhd = s2.nhd;
	new_s.notes = []
	for (i = 0; i < s.notes.length; i++) {
		new_s.notes[i] = {
			pit: s2.notes[i].pit,
			shhd: 0,
			dur: BASE_LEN / 4
		}
	}
	new_s.stemless = true
}

/* -- define the beginning of a new music line -- */
function set_nl(s) {
	var s2, p_voice, done

	// set the end of line marker and
	function set_eol(s) {
		if (cfmt.custos && voice_tb.length == 1)
			custos_add(s)

		// set the nl flag if more music
		for (var s2 = s.ts_next; s2; s2 = s2.ts_next) {
			if (s2.seqst) {
				s.nl = true
				break
			}
		}
	} // set_eol()

	// set the eol on the next symbol
	function set_eol_next(s) {
		if (!s.next) {		// special case: the voice stops here
			set_eol(s)
			return s
		}
		for (s = s.ts_next; s; s = s.ts_next) {
			if (s.seqst) {
				set_eol(s)
				break
			}
		}
		return s
	} // set_eol_next()

	/* if explicit EOLN, cut on the next symbol */
	if (s.eoln && !cfmt.keywarn && !cfmt.timewarn)
		return set_eol_next(s)

	/* if normal symbol, cut here */
	switch (s.type) {
	case CLEF:
	case BAR:
	case STAVES:
		break
	case KEY:
		if (cfmt.keywarn && !s.k_none)
			break
		return set_eol_next(s)
	case METER:
		if (cfmt.timewarn)
			break
		return set_eol_next(s)
	case GRACE:			/* don't cut on a grace note */
		s = s.next
		if (!s)
			return s
		/* fall thru */
	default:
		return set_eol_next(s)
	}

	/* go back to handle the staff breaks at end of line */
	for (; s; s = s.ts_prev) {
		if (!s.seqst)
			continue
		switch (s.type) {
		case KEY:
		case CLEF:
		case METER:
			continue
		}
		break
	}
	done = 0
	for ( ; ; s = s.ts_next) {
		if (!s)
			return s
		if (!s.seqst)
			continue
		if (done < 0)
			break
		switch (s.type) {
		case STAVES:
			if (s.ts_prev && s.ts_prev.type == BAR)
				break
			while (s.ts_next) {
				if (w_tb[s.ts_next.type] != 0
				 && s.ts_next.type != CLEF)
					break
				s = s.ts_next
			}
			if (!s.ts_next || s.ts_next.type != BAR)
				continue
			s = s.ts_next
			// fall thru
		case BAR:
			if (done)
				break
			done = 1;
			continue
		case STBRK:
			if (!s.stbrk_forced)
				unlksym(s)	/* remove */
			else
				done = -1	// keep the next symbols on the next line
			continue
		case METER:
			if (!cfmt.timewarn)
				break
			continue
		case CLEF:
			if (done)
				break
			continue
		case KEY:
			if (!cfmt.keywarn || s.k_none)
				break
			continue
		default:
			if (!done || (s.prev && s.prev.type == GRACE))
				continue
			break
		}
		break
	}
	set_eol(s)
	return s
}

/* get the width of the starting clef and key signature */
// return
//	r[0] = width of clef and key signature
//	r[1] = width of the meter
function get_ck_width() {
    var	r0, r1,
	p_voice = voice_tb[0]

	set_width(p_voice.clef);
	set_width(p_voice.key);
	set_width(p_voice.meter)
	return [p_voice.clef.wl + p_voice.clef.wr +
			p_voice.key.wl + p_voice.key.wr,
		p_voice.meter.wl + p_voice.meter.wr]
}

// get the width of the symbols up to the next eoln or eof
function get_width(s, last) {
	var	shrink, space,
		w = 0,
		sp_fac = (1 - cfmt.maxshrink)

	do {
		if (s.seqst) {
			shrink = s.shrink
			if ((space = s.space) < shrink)
				w += shrink
			else
				w += shrink * cfmt.maxshrink
					+ space * sp_fac
			s.x = w
		}
		if (s == last)
			break
		s = s.ts_next
	} while (s)
	return w;
}

/* -- search where to cut the lines according to the staff width -- */
function set_lines(	s,		/* first symbol */
			last,		/* last symbol / null */
			lwidth,		/* w - (clef & key sig) */
			indent) {	/* for start of tune */
	var	first, s2, s3, x, xmin, xmid, xmax, wwidth, shrink, space,
		nlines, cut_here;

	for ( ; last; last = last.ts_next) {
		if (last.eoln)
			break
	}

	/* calculate the whole size of the piece of tune */
	wwidth = get_width(s, last) + indent

	/* loop on cutting the tune into music lines */
	while (1) {
		nlines = Math.ceil(wwidth / lwidth)
		if (nlines <= 1) {
			if (last)
				last = set_nl(last)
			return last
		}

		s2 = first = s;
		xmin = s.x - s.shrink - indent;
		xmax = xmin + lwidth;
		xmid = xmin + wwidth / nlines;
		xmin += wwidth / nlines * cfmt.breaklimit;
		for (s = s.ts_next; s != last ; s = s.ts_next) {
			if (!s.x)
				continue
			if (s.type == BAR)
				s2 = s
			if (s.x >= xmin)
				break
		}
//fixme: can this occur?
		if (s == last) {
			if (last)
				last = set_nl(last)
			return last
		}

		/* try to cut on a measure bar */
		cut_here = false;
		s3 = null
		for ( ; s != last; s = s.ts_next) {
			x = s.x
			if (!x)
				continue
			if (x > xmax)
				break
			if (s.type != BAR)
				continue
			if (x < xmid) {
				s3 = s		// keep the last bar
				continue
			}

			// cut on the bar closest to the middle
			if (!s3 || s.x < xmid) {
				s3 = s
				continue
			}
			if (s3 > xmid)
				break
			if (xmid - s3.x < s.x - xmid)
				break
			s3 = s
			break
		}

		/* if a bar, cut here */
		if (s3) {
			s = s3;
			cut_here = true
		}

		/* try to avoid to cut a beam or a tuplet */
		if (!cut_here) {
			var	beam = 0,
				bar_time = s2.time;

			xmax -= 8; // (left width of the inserted bar in set_allsymwidth)
			s = s2;			// restart from start or last bar
			s3 = null
			for ( ; s != last; s = s.ts_next) {
				if (s.beam_st)
					beam++
				if (s.beam_end && beam > 0)
					beam--
				x = s.x
				if (!x)
					continue
				if (x + s.wr >= xmax)
					break
				if (beam || s.in_tuplet)
					continue
//fixme: this depends on the meter
				if ((s.time - bar_time) % (BASE_LEN / 4) == 0) {
					s3 = s
					continue
				}
				if (!s3 || s.x < xmid) {
					s3 = s
					continue
				}
				if (s3 > xmid)
					break
				if (xmid - s3.x < s.x - xmid)
					break
				s3 = s
				break
			}
			if (s3) {
				s = s3;
				cut_here = true
			}
		}

		// cut anyhere
		if (!cut_here) {
			s3 = s = s2
			for ( ; s != last; s = s.ts_next) {
				x = s.x
				if (!x)
					continue
				if (s.x < xmid) {
					s3 = s
					continue
				}
				if (s3 > xmid)
					break
				if (xmid - s3.x < s.x - xmid)
					break
				s3 = s
				break
			}
			s = s3
		}

		if (s.nl) {		/* already set here - advance */
			error(0, s,
			    "Line split problem - adjust maxshrink and/or breaklimit");
			nlines = 2
			for (s = s.ts_next; s != last; s = s.ts_next) {
				if (!s.x)
					continue
				if (--nlines <= 0)
					break
			}
		}
		s = set_nl(s)
		if (!s
		 || (last && s.time >= last.time))
			break
		wwidth -= s.x - first.x;
		indent = 0
	}
	return s
}

/* -- cut the tune into music lines -- */
function cut_tune(lwidth, indent) {
	var	s, s2, s3, i, xmin,
//fixme: not usable yet
//		pg_sav = {
//			leftmargin: cfmt.leftmargin,
//			rightmargin: cfmt.rightmargin,
//			pagewidth: cfmt.pagewidth,
//			scale: cfmt.scale
//		},
		s = tsfirst

	// take care of the voice subnames
	if (indent != 0) {
		i = set_indent()
		lwidth -= i;
		indent -= i;
	}

	/* adjust the line width according to the starting clef
	 * and key signature */
/*fixme: may change in the tune*/
	i = get_ck_width();
	lwidth -= i[0];
	indent += i[1]

	if (cfmt.custos && voice_tb.length == 1)
		lwidth -= 12

	/* if asked, count the measures and set the EOLNs */
	if (cfmt.barsperstaff) {
		i = cfmt.barsperstaff;
		for (s2 = s; s2; s2 = s2.ts_next) {
			if (s2.type != BAR
			 || !s2.bar_num
			 || --i > 0)
				continue
			s2.eoln = true;
			i = cfmt.barsperstaff
		}
	}

	/* cut at explicit end of line, checking the line width */
	xmin = indent;
	s2 = s
	for ( ; s; s = s.ts_next) {
//fixme: not usable yet
//		if (s.type == BLOCK) {
//			switch (s.subtype) {
//			case "leftmargin":
//			case "rightmargin":
//			case "pagescale":
//			case "pagewidth":
//			case "scale":
//			case "staffwidth":
//				set_format(s.subtype, s.param)
//				break
//			}
//			continue
//		}
		if (!s.seqst && !s.eoln)
			continue
		xmin += s.shrink
		if (xmin > lwidth) {		// overflow
			s2 = set_lines(s2, s, lwidth, indent)
		} else {
			if (!s.eoln)
				continue
			delete s.eoln

			// if eoln on a note or a rest,
			// check for a smaller duration in an other voice
			if (s.dur) {
				for (s3 = s.ts_next; s3; s3 = s3.ts_next) {
					if (s3.seqst
					 || s3.dur < s.dur)
						break
				}
				if (s3 && !s3.seqst)
					s2 = set_lines(s2, s, lwidth, indent)
				else
					s2 = set_nl(s)
			} else {
				s2 = set_nl(s)
			}
		}
		if (!s2)
			break

		// (s2 may be tsfirst - no ts_prev - when only one
		//  embedded info in the first line after the first K:)
		if (!s2.ts_prev) {
			delete s2.nl
			continue
		}
		xmin = s2.shrink;
		s = s2.ts_prev;		// don't miss an eoln
		indent = 0
	}

//fixme: not usable yet
//	// restore the page parameters at start of line
//	cfmt.leftmargin = pg_sav.leftmargin;
//	cfmt.rightmargin = pg_sav.rightmargin;
//	cfmt.pagewidth = pg_sav.pagewidth;
//	cfmt.scale = pg_sav.scale
}

/* -- set the y values of some symbols -- */
function set_yval(s) {
//fixme: staff_tb is not yet defined
//	var top = staff_tb[s.st].topbar
//	var bot = staff_tb[s.st].botbar
	switch (s.type) {
	case CLEF:
		if (s.second
		 || s.invis) {
//			s.ymx = s.ymn = (top + bot) / 2
			s.ymx = s.ymn = 12
			break
		}
		s.y = (s.clef_line - 1) * 6
		switch (s.clef_type) {
		default:			/* treble / perc */
			s.ymx = s.y + 28
			s.ymn = s.y - 14
			break
		case "c":
			s.ymx = s.y + 13
			s.ymn = s.y - 11
			break
		case "b":
			s.ymx = s.y + 7
			s.ymn = s.y - 12
			break
		}
		if (s.clef_small) {
			s.ymx -= 2;
			s.ymn += 2
		}
		if (s.ymx < 26)
			s.ymx = 26
		if (s.ymn > -1)
			s.ymn = -1
//		s.y += s.clef_line * 6
//		if (s.y > 0)
//			s.ymx += s.y
//		else if (s.y < 0)
//			s.ymn += s.y
		if (s.clef_octave) {
			if (s.clef_octave > 0)
				s.ymx += 12
			else
				s.ymn -= 12
		}
		break
	case KEY:
		if (s.k_sf > 2)
			s.ymx = 24 + 10
		else if (s.k_sf > 0)
			s.ymx = 24 + 6
		else
			s.ymx = 24 + 2;
		s.ymn = -2
		break
	default:
//		s.ymx = top + 2;
		s.ymx = 24 + 2;
		s.ymn = -2
		break
	}
}

// set the clefs (treble or bass) in a 'auto clef' sequence
// return the starting clef type
function set_auto_clef(st, s_start, clef_type_start) {
	var s, min, max, time, s2, s3;

	/* get the max and min pitches in the sequence */
	max = 12;					/* "F," */
	min = 20					/* "G" */
	for (s = s_start; s; s = s.ts_next) {
		if (s.type == STAVES && s != s_start)
			break
		if (s.st != st)
			continue
		if (s.type != NOTE) {
			if (s.type == CLEF) {
				if (s.clef_type != 'a')
					break
				unlksym(s)
			}
			continue
		}
		if (s.notes[0].pit < min)
			min = s.notes[0].pit
		else if (s.notes[s.nhd].pit > max)
			max = s.notes[s.nhd].pit
	}

	if (min >= 19					/* upper than 'F' */
	 || (min >= 13 && clef_type_start != 'b'))	/* or 'G,' */
		return 't'
	if (max <= 13					/* lower than 'G,' */
	 || (max <= 19 && clef_type_start != 't'))	/* or 'F' */
		return 'b'

	/* set clef changes */
	if (clef_type_start == 'a') {
		if ((max + min) / 2 >= 16)
			clef_type_start = 't'
		else
			clef_type_start = 'b'
	}
	var	clef_type = clef_type_start,
		s_last = s,
		s_last_chg = null
	for (s = s_start; s != s_last; s = s.ts_next) {
		if (s.type == STAVES && s != s_start)
			break
		if (s.st != st || s.type != NOTE)
			continue

		/* check if a clef change may occur */
		time = s.time
		if (clef_type == 't') {
			if (s.notes[0].pit > 12		/* F, */
			 || s.notes[s.nhd].pit > 20) {	/* G */
				if (s.notes[0].pit > 20)
					s_last_chg = s
				continue
			}
			s2 = s.ts_prev
			if (s2
			 && s2.time == time
			 && s2.st == st
			 && s2.type == NOTE
			 && s2.notes[0].pit >= 19)	/* F */
				continue
			s2 = s.ts_next
			if (s2
			 && s2.st == st
			 && s2.time == time
			 && s2.type == NOTE
			 && s2.notes[0].pit >= 19)	/* F */
				continue
		} else {
			if (s.notes[0].pit < 12		/* F, */
			 || s.notes[s.nhd].pit < 20) {	/* G */
				if (s.notes[s.nhd].pit < 12)
					s_last_chg = s
				continue
			}
			s2 = s.ts_prev
			if (s2
			 && s2.time == time
			 && s2.st == st
			 && s2.type == NOTE
			 && s2.notes[0].pit <= 13)	/* G, */
				continue
			s2 = s.ts_next
			if (s2
			 && s2.st == st
			 && s2.time == time
			 && s2.type == NOTE
			 && s2.notes[0].pit <= 13)	/* G, */
				continue
		}

		/* if first change, change the starting clef */
		if (!s_last_chg) {
			clef_type = clef_type_start =
					clef_type == 't' ? 'b' : 't';
			s_last_chg = s
			continue
		}

		/* go backwards and search where to insert a clef change */
		s3 = s
		for (s2 = s.ts_prev; s2 != s_last_chg; s2 = s2.ts_prev) {
			if (s2.st != st)
				continue
			if (s2.type == BAR
			 && s2.v == s.v) {
				s3 = s2
				break
			}
			if (s2.type != NOTE)
				continue

			/* have a 2nd choice on beam start */
			if (s2.beam_st
			 && !s2.p_v.second)
				s3 = s2
		}

		/* no change possible if no insert point */
		if (s3.time == s_last_chg.time) {
			s_last_chg = s
			continue
		}
		s_last_chg = s;

		/* insert a clef change */
		clef_type = clef_type == 't' ? 'b' : 't';
		s2 = insert_clef(s3, clef_type, clef_type == "t" ? 2 : 4);
		s2.clef_auto = true
//		s3.prev.st = st
	}
	return clef_type_start
}

/* set the clefs */
/* this function is called once at start of tune generation */
/*
 * global variables:
 *	- staff_tb[st].clef = clefs at start of line (here, start of tune)
 *				(created here, updated on clef draw)
 *	- voice_tb[v].clef = clefs at end of generation
 *				(created on voice creation, updated here)
 */
function set_clefs() {
	var	s, s2, st, v, p_voice, g, new_type, new_line, p_staff, pit,
		staff_clef = new Array(nstaff),	// st -> { clef, autoclef }
		sy = cur_sy,
		mid = []

	// create the staff table
	staff_tb = new Array(nstaff)
	for (st = 0; st <= nstaff; st++) {
		staff_clef[st] = {
			autoclef: true
		}
		staff_tb[st] = {
			output: [],
			sc_out: []
		}
	}

	// set the starting clefs of the staves
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (sy.voices[v].range < 0)
			continue
		st = sy.voices[v].st
		if (!sy.voices[v].second) {		// main voices
			if (p_voice.stafflines != undefined)
				sy.staves[st].stafflines = p_voice.stafflines
			if (p_voice.staffnonote != undefined)
				sy.staves[st].staffnonote = p_voice.staffnonote
			if (p_voice.staffscale)
				sy.staves[st].staffscale = p_voice.staffscale
			if (sy.voices[v].sep)
				sy.staves[st].sep = sy.voices[v].sep
			if (sy.voices[v].maxsep)
				sy.staves[st].maxsep = sy.voices[v].maxsep;
		}
		if (!sy.voices[v].second
		 && !p_voice.clef.clef_auto)
			staff_clef[st].autoclef = false
	}
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (sy.voices[v].range < 0
		 || sy.voices[v].second)		// main voices
			continue
		st = sy.voices[v].st;
		s = p_voice.clef
		if (staff_clef[st].autoclef) {
			s.clef_type = set_auto_clef(st,
						tsfirst,
						s.clef_type);
			s.clef_line = s.clef_type == 't' ? 2 : 4
		}
		staff_clef[st].clef = staff_tb[st].clef = s
	}
	for (st = 0; st <= sy.nstaff; st++)
		mid[st] = (sy.staves[st].stafflines.length - 1) * 3

	for (s = tsfirst; s; s = s.ts_next) {
		if (s.repeat_n)
			set_repeat(s)

		switch (s.type) {
		case STAVES:
			sy = s.sy
			for (st = 0; st <= nstaff; st++)
				staff_clef[st].autoclef = true
			for (v = 0; v < voice_tb.length; v++) {
				if (sy.voices[v].range < 0)
					continue
				p_voice = voice_tb[v];
				st = sy.voices[v].st
				if (!sy.voices[v].second) {
					if (p_voice.stafflines != undefined)
						sy.staves[st].stafflines = p_voice.stafflines
					if (p_voice.staffnonote != undefined)
						sy.staves[st].staffnonote = p_voice.staffnonote
					if (p_voice.staffscale)
						sy.staves[st].staffscale = p_voice.staffscale
					if (sy.voices[v].sep)
						sy.staves[st].sep = sy.voices[v].sep
					if (sy.voices[v].maxsep)
						sy.staves[st].maxsep = sy.voices[v].maxsep
				}
				s2 = p_voice.clef
				if (!s2.clef_auto)
					staff_clef[st].autoclef = false
			}
			for (st = 0; st <= sy.nstaff; st++)
				mid[st] = (sy.staves[st].stafflines.length - 1) * 3
			for (v = 0; v < voice_tb.length; v++) {
				if (sy.voices[v].range < 0
				 || sy.voices[v].second)	// main voices
					continue
				p_voice = voice_tb[v];
				st = sy.voices[v].st;
				s2 = p_voice.clef
				if (s2.clef_auto) {
//fixme: the staff may have other voices with explicit clefs...
//					if (!staff_clef[st].autoclef)
//						???
					new_type = set_auto_clef(st, s,
						staff_clef[st].clef ?
							staff_clef[st].clef.clef_type :
							'a');
					new_line = new_type == 't' ? 2 : 4
				} else {
					new_type = s2.clef_type;
					new_line = s2.clef_line
				}
				if (!staff_clef[st].clef) {	// new staff
					if (s2.clef_auto) {
						if (s2.type != 'a')
							p_voice.clef =
								clone(p_voice.clef);
						p_voice.clef.clef_type = new_type;
						p_voice.clef.clef_line = new_line
					}
					staff_tb[st].clef =
						staff_clef[st].clef = p_voice.clef
					continue
				}
								// old staff
				if (new_type == staff_clef[st].clef.clef_type
				 && new_line == staff_clef[st].clef.clef_line)
					continue
				g = s.ts_next
				while (g && (g.v != v || g.st != st))
					g = g.ts_next
				if (!g)				// ??
					continue
				if (g.type != CLEF) {
					g = insert_clef(g, new_type, new_line)
					if (s2.clef_auto)
						g.clef_auto = true
				}
				staff_clef[st].clef = p_voice.clef = g
			}
			continue
		default:
			s.mid = mid[s.st]
			continue
		case CLEF:
			break
		}

		if (s.clef_type == 'a') {
			s.clef_type = set_auto_clef(s.st,
						s.ts_next,
						staff_clef[s.st].clef.clef_type);
			s.clef_line = s.clef_type == 't' ? 2 : 4
		}

		p_voice = s.p_v;
		p_voice.clef = s
		if (s.second) {
/*fixme:%%staves:can this happen?*/
//			if (!s.prev)
//				break
			unlksym(s)
			continue
		}
		st = s.st
// may have been inserted on %%staves
//		if (s.clef_auto) {
//			unlksym(s)
//			continue
//		}

		if (staff_clef[st].clef) {
			if (s.clef_type == staff_clef[st].clef.clef_type
			 && s.clef_line == staff_clef[st].clef.clef_line) {
//				unlksym(s)
				continue
			}
		} else {

			// the voice moved to a new staff with a forced clef
			staff_tb[st].clef = s
		}
		staff_clef[st].clef = s
	}

	/* set a pitch to the symbols of voices with no note */
	sy = cur_sy
	for (v = 0; v < voice_tb.length; v++) {
		if (sy.voices[v].range < 0)
			continue
		s2 = voice_tb[v].sym
		if (!s2 || s2.notes[0].pit != 127)
			continue
		st = sy.voices[v].st
		switch (staff_tb[st].clef.clef_type) {
		default:
			pit = 22		/* 'B' */
			break
		case "c":
			pit = 16		/* 'C' */
			break
		case "b":
			pit = 10		/* 'D,' */
			break
		}
		for (s = s2; s; s = s.next)
			s.notes[0].pit = pit
	}
}

/* set the pitch of the notes according to the clefs
 * and set the vertical offset of the symbols */
/* this function is called at start of tune generation and
 * then, once per music line up to the old sequence */

var delta_tb = {
	t: 0 - 2 * 2,
	c: 6 - 3 * 2,
	b: 12 - 4 * 2,
	p: 0 - 3 * 2
}

/* upper and lower space needed by rests */
var rest_sp = [
	[18, 18],
	[12, 18],
	[12, 12],
	[0, 12],
	[6, 8],
	[10, 10],			/* crotchet */
	[6, 4],
	[10, 0],
	[10, 4],
	[10, 10]
]

function set_pitch(last_s) {
	var	s, s2, g, st, delta, m, pitch, note,
		dur = BASE_LEN,
		staff_delta = new Array(nstaff),
		sy = cur_sy

	// set the starting clefs of the staves
	for (st = 0; st <= nstaff; st++) {
		s = staff_tb[st].clef;
		staff_delta[st] = delta_tb[s.clef_type] + s.clef_line * 2
		if (s.clefpit)
			staff_delta[st] += s.clefpit
		if (cfmt.sound) {
			if (s.clef_octave && !s.clef_oct_transp)
				staff_delta[st] += s.clef_octave
		} else {
			if (s.clef_oct_transp)
				staff_delta[st] -= s.clef_octave
		}
	}

	for (s = tsfirst; s != last_s; s = s.ts_next) {
		st = s.st
		switch (s.type) {
		case CLEF:
			staff_delta[st] = delta_tb[s.clef_type] +
						s.clef_line * 2
			if (s.clefpit)
				staff_delta[st] += s.clefpit
			if (cfmt.sound) {
				if (s.clef_octave && !s.clef_oct_transp)
					staff_delta[st] += s.clef_octave
			} else {
				if (s.clef_oct_transp)
					staff_delta[st] -= s.clef_octave
			}
			set_yval(s)
			break
		case GRACE:
			for (g = s.extra; g; g = g.next) {
				delta = staff_delta[g.st]
				if (delta != 0
				 && !s.p_v.key.k_drum) {
					for (m = 0; m <= g.nhd; m++) {
						note = g.notes[m];
						note.pit += delta
					}
				}
				g.ymn = 3 * (g.notes[0].pit - 18) - 2;
				g.ymx = 3 * (g.notes[g.nhd].pit - 18) + 2
			}
			set_yval(s)
			break
		case KEY:
			s.k_y_clef = staff_delta[st] /* keep the y delta */
			/* fall thru */
		default:
			set_yval(s)
			break
		case MREST:
			if (s.invis)
				break
			s.y = 12;
			s.ymx = 24 + 15;
			s.ymn = -2
			break
		case REST:
			if (voice_tb.length == 1) {
				s.y = 12;		/* rest single voice */
//				s.ymx = 12 + 8;
//				s.ymn = 12 - 8
				s.ymx = 24;
				s.ymn = 0
				break
			}
			// fall thru
		case NOTE:
			delta = staff_delta[st]
			if (delta != 0
			 && !s.p_v.key.k_drum) {
				for (m = s.nhd; m >= 0; m--)
					s.notes[m].pit += delta
			}
			if (s.type == NOTE) {
				s.ymx = 3 * (s.notes[s.nhd].pit - 18) + 4;
				s.ymn = 3 * (s.notes[0].pit - 18) - 4;
			} else {
				s.y = (((s.notes[0].pit - 18) / 2) | 0) * 6;
				s.ymx = s.y + rest_sp[5 - s.nflags][0];
				s.ymn = s.y - rest_sp[5 - s.nflags][1]
			}
			if (s.dur < dur)
				dur = s.dur
			break
		}
	}
	if (!last_s)
		smallest_duration = dur
}

/* -- set the stem direction when multi-voices -- */
/* this function is called only once per tune */
function set_stem_dir() {
	var	t, u, i, st, rvoice, v,
		v_st,			// voice -> staff 1 & 2
		st_v, vobj,		// staff -> (v, ymx, ymn)*
		v_st_tb,		// array of v_st
		st_v_tb = [],		// array of st_v
		s = tsfirst,
		sy = cur_sy,
		nst = sy.nstaff

	while (s) {
		for (st = 0; st <= nst; st++)
			st_v_tb[st] = []
		v_st_tb = []

		/* get the max/min offsets in the delta time */
/*fixme: the stem height is not calculated yet*/
		for (u = s; u; u = u.ts_next) {
			if (u.type == BAR)
				break;
			if (u.type == STAVES) {
				if (u != s)
					break
				sy = s.sy
				for (st = nst; st <= sy.nstaff; st++)
					st_v_tb[st] = []
				nst = sy.nstaff
				continue
			}
			if ((u.type != NOTE && u.type != REST)
			 || u.invis)
				continue
			st = u.st;
/*fixme:test*/
if (st > nst) {
	var msg = "*** fatal set_stem_dir(): bad staff number " + st +
			" max " + nst;
	error(2, null, msg);
	throw new Error(msg)
}
			v = u.v;
			v_st = v_st_tb[v]
			if (!v_st) {
				v_st = {
					st1: -1,
					st2: -1
				}
				v_st_tb[v] = v_st
			}
			if (v_st.st1 < 0) {
				v_st.st1 = st
			} else if (v_st.st1 != st) {
				if (st > v_st.st1) {
					if (st > v_st.st2)
						v_st.st2 = st
				} else {
					if (v_st.st1 > v_st.st2)
						v_st.st2 = v_st.st1;
					v_st.st1 = st
				}
			}
			st_v = st_v_tb[st];
			rvoice = sy.voices[v].range;
			for (i = st_v.length; --i >= 0; ) {
				vobj = st_v[i]
				if (vobj.v == rvoice)
					break
			}
			if (i < 0) {
				vobj = {
					v: rvoice,
					ymx: 0,
					ymn: 24
				}
				for (i = 0; i < st_v.length; i++) {
					if (rvoice < st_v[i].v) {
						st_v.splice(i, 0, vobj)
						break
					}
				}
				if (i == st_v.length)
					st_v.push(vobj)
			}

			if (u.type != NOTE)
				continue
			if (u.ymx > vobj.ymx)
				vobj.ymx = u.ymx
			if (u.ymn < vobj.ymn)
				vobj.ymn = u.ymn

			if (u.xstem) {
				if (u.ts_prev.st != st - 1
				 || u.ts_prev.type != NOTE) {
					error(1, s, "Bad !xstem!");
					u.xstem = false
/*fixme:nflags KO*/
				} else {
					u.ts_prev.multi = 1;
					u.multi = 1;
					u.stemless = true
				}
			}
		}

		for ( ; s != u; s = s.ts_next) {
			if (s.multi)
				continue
			switch (s.type) {
			default:
				continue
			case REST:
				// handle %%voicecombine 0
				if ((s.combine != undefined && s.combine < 0)
				 || !s.ts_next || s.ts_next.type != REST
				 || s.ts_next.st != s.st
				 || s.time != s.ts_next.time
				 || s.dur != s.ts_next.dur
				 || s.invis)
					break
				unlksym(s.ts_next)
				break
			case NOTE:
			case GRACE:
				break
			}

			st = s.st;
			v = s.v;
			v_st = v_st_tb[v];
			st_v = st_v_tb[st]
			if (v_st && v_st.st2 >= 0) {
				if (st == v_st.st1)
					s.multi = -1
				else if (st == v_st.st2)
					s.multi = 1
				continue
			}
			if (st_v.length <= 1) { /* voice alone on the staff */
//				if (s.multi)
//					continue
/*fixme:could be done in set_var()*/
				if (s.floating)
					s.multi = st == voice_tb[v].st ? -1 : 1
				continue
			}
			rvoice = sy.voices[v].range
			for (i = st_v.length; --i >= 0; ) {
				if (st_v[i].v == rvoice)
					break
			}
			if (i < 0)
				continue		/* voice ignored */
			if (i == st_v.length - 1) {
				s.multi = -1	/* last voice */
			} else {
				s.multi = 1	/* first voice(s) */

				/* if 3 voices, and vertical space enough,
				 * have stems down for the middle voice */
				if (i != 0 && i + 2 == st_v.length) {
					if (st_v[i].ymn - cfmt.stemheight
							> st_v[i + 1].ymx)
						s.multi = -1;

					/* special case for unison */
					t = s.ts_next
//fixme: pb with ../lacerda/evol-7.5.5.abc
					if (s.ts_prev
					 && s.ts_prev.time == s.time
					 && s.ts_prev.st == s.st
					 && s.notes[s.nhd].pit == s.ts_prev.notes[0].pit
					 && s.beam_st
					 && s.beam_end
					 && (!t
					  || t.st != s.st
					  || t.time != s.time))
						s.multi = -1
				}
			}
		}
		while (s && s.type == BAR)
			s = s.ts_next
	}
}

/* -- adjust the offset of the rests when many voices -- */
/* this function is called only once per tune */
function set_rest_offset() {
	var	s, s2, v, end_time, not_alone, v_s, y, ymax, ymin,
		shift, dots, dx,
		v_s_tb = [],
		sy = cur_sy

	for (s = tsfirst; s; s = s.ts_next) {
		if (s.invis)
			continue
		if (s.type == STAVES)
			sy = s.sy
		if (!s.dur)
			continue
		v_s = v_s_tb[s.v]
		if (!v_s) {
			v_s = {}
			v_s_tb[s.v] = v_s
		}
		v_s.s = s;
		v_s.st = s.st;
		v_s.end_time = s.time + s.dur
		if (s.type != REST)
			continue

		/* check if clash with previous symbols */
		ymin = -127;
		ymax = 127;
		not_alone = dots = false
		for (v = 0; v <= v_s_tb.length; v++) {
			v_s = v_s_tb[v]
			if (!v_s || !v_s.s
			 || v_s.st != s.st
			 || v == s.v)
				continue
			if (v_s.end_time <= s.time)
				continue
			not_alone = true;
			s2 = v_s.s
			if (sy.voices[v].range < sy.voices[s.v].range) {
				if (s2.time == s.time) {
					if (s2.ymn < ymax) {
						ymax = s2.ymn
						if (s2.dots)
							dots = true
					}
				} else {
					if (s2.y < ymax)
						ymax = s2.y
				}
			} else {
				if (s2.time == s.time) {
					if (s2.ymx > ymin) {
						ymin = s2.ymx
						if (s2.dots)
							dots = true
					}
				} else {
					if (s2.y > ymin)
						ymin = s2.y
				}
			}
		}

		/* check if clash with next symbols */
		end_time = s.time + s.dur
		for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
			if (s2.time >= end_time)
				break
			if (s2.st != s.st
//			 || (s2.type != NOTE && s2.type != REST)
			 || !s2.dur
			 || s2.invis)
				continue
			not_alone = true
			if (sy.voices[s2.v].range < sy.voices[s.v].range) {
				if (s2.time == s.time) {
					if (s2.ymn < ymax) {
						ymax = s2.ymn
						if (s2.dots)
							dots = true
					}
				} else {
					if (s2.y < ymax)
						ymax = s2.y
				}
			} else {
				if (s2.time == s.time) {
					if (s2.ymx > ymin) {
						ymin = s2.ymx
						if (s2.dots)
							dots = true
					}
				} else {
					if (s2.y > ymin)
						ymin = s2.y
				}
			}
		}
		if (!not_alone) {
			s.y = 12;
			s.ymx = 24;
			s.ymn = 0
			continue
		}
		if (ymax == 127 && s.y < 12) {
			shift = 12 - s.y
			s.y += shift;
			s.ymx += shift;
			s.ymn += shift
		}
		if (ymin == -127 && s.y > 12) {
			shift = s.y - 12
			s.y -= shift;
			s.ymx -= shift;
			s.ymn -= shift
		}
		shift = ymax - s.ymx
		if (shift < 0) {
			shift = Math.ceil(-shift / 6) * 6
			if (s.ymn - shift >= ymin) {
				s.y -= shift;
				s.ymx -= shift;
				s.ymn -= shift
				continue
			}
			dx = dots ? 15 : 10;
			s.notes[0].shhd = dx;
			s.xmx = dx
			continue
		}
		shift = ymin - s.ymn
		if (shift > 0) {
			shift = Math.ceil(shift / 6) * 6
			if (s.ymx + shift <= ymax) {
				s.y += shift;
				s.ymx += shift;
				s.ymn += shift
				continue
			}
			dx = dots ? 15 : 10;
			s.notes[0].shhd = dx;
			s.xmx = dx
			continue
		}
	}
}

/* -- create a starting symbol -- */
function new_sym(type, p_voice,
			last_s) {	/* symbol at same time */
	var s = {
		type: type,
		ctx: last_s.ctx,
//		istart: last_s.istart,
//		iend: last_s.iend,
		v: p_voice.v,
		p_v: p_voice,
		st: p_voice.st,
		time: last_s.time,
		next: p_voice.last_sym.next
	}
	if (s.next)
		s.next.prev = s;
	p_voice.last_sym.next = s;
	s.prev = p_voice.last_sym;
	p_voice.last_sym = s;

	lktsym(s, last_s)
	if (s.ts_prev.type != type)
		s.seqst = true
	if (last_s.type == type && s.v != last_s.v) {
		delete last_s.seqst;
		last_s.shrink = 0
	}
	return s
}

/* -- init the symbols at start of a music line -- */
function init_music_line() {
	var	p_voice, s, s2, last_s, v, st,
		nv = voice_tb.length

	/* initialize the voices */
	for (v = 0; v < nv; v++) {
		if (cur_sy.voices[v].range < 0)
			continue
		p_voice = voice_tb[v];
		p_voice.second = cur_sy.voices[v].second;
		p_voice.last_sym = p_voice.sym;

		/* move the voice to a printed staff */
		st = cur_sy.voices[v].st
		while (st < nstaff && !cur_sy.st_print[st])
			st++;
		p_voice.st = st
	}

	/* add a clef at start of the main voices */
	last_s = tsfirst
	while (last_s.type == CLEF) {		/* move the starting clefs */
		v = last_s.v
		if (cur_sy.voices[v].range >= 0
		 && !cur_sy.voices[v].second) {
			delete last_s.clef_small;	/* normal clef */
			p_voice = last_s.p_v;
			p_voice.last_sym = p_voice.sym = last_s
		}
		last_s = last_s.ts_next
	}
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (p_voice.sym && p_voice.sym.type == CLEF)
			continue
		if (cur_sy.voices[v].range < 0
		 || (cur_sy.voices[v].second
		  && !p_voice.bar_start))	// needed for correct linkage
			continue
		st = cur_sy.voices[v].st
		if (!staff_tb[st]
		 || !staff_tb[st].clef)
			continue
		s = clone(staff_tb[st].clef);
		s.v = v;
		s.p_v = p_voice;
		s.st = st;
		s.time = tsfirst.time;
		s.prev = null;
		s.next = p_voice.sym
		if (s.next)
			s.next.prev = s;
		p_voice.sym = s;
		p_voice.last_sym = s;
		s.ts_next = last_s;
		if (last_s)
			s.ts_prev = last_s.ts_prev
		else
			s.ts_prev = null
		if (!s.ts_prev) {
			tsfirst = s;
			s.seqst = true
		} else {
			s.ts_prev.ts_next = s
			delete s.seqst
		}
		if (last_s) {
			last_s.ts_prev = s
			if (last_s.type == CLEF)
				delete last_s.seqst
		}
		delete s.clef_small;
		s.second = cur_sy.voices[v].second
// (fixme: needed for sample5 X:3 Fugue & staffnonote.xhtml)
		if (!cur_sy.st_print[st])
			s.invis = true
	}

	/* add keysig */
	for (v = 0; v < nv; v++) {
		if (cur_sy.voices[v].range < 0
		 || cur_sy.voices[v].second
		 || !cur_sy.st_print[cur_sy.voices[v].st])
			continue
		p_voice = voice_tb[v]
		if (last_s && last_s.v == v && last_s.type == KEY) {
			p_voice.last_sym = last_s;
			last_s.k_old_sf = last_s.k_sf;	// no key cancel
			last_s = last_s.ts_next
			continue
		}
		s2 = p_voice.key
		if (s2.k_sf || s2.k_a_acc) {
			s = new_sym(KEY, p_voice, last_s);
			s.k_sf = s2.k_sf;
			s.k_old_sf = s2.k_sf;	// no key cancel
			s.k_none = s2.k_none;
			s.k_a_acc = s2.k_a_acc;
			s.istart = s2.istart;
			s.iend = s2.iend
			if (s2.k_bagpipe) {
				s.k_bagpipe = s2.k_bagpipe
				if (s.k_bagpipe == 'p')
					s.k_old_sf = 3	/* "A" -> "D" => G natural */
			}
		}
	}

	/* add time signature (meter) if needed */
	if (insert_meter & 1) {
		for (v = 0; v < nv; v++) {
			p_voice = voice_tb[v];
			s2 = p_voice.meter
			if (cur_sy.voices[v].range < 0
			 || cur_sy.voices[v].second
			 || !cur_sy.st_print[cur_sy.voices[v].st]
			 || s2.a_meter.length == 0)
				continue
			if (last_s && last_s.v == v && last_s.type == METER) {
				p_voice.last_sym = last_s;
				last_s = last_s.ts_next
				continue
			}
			s = new_sym(METER, p_voice, last_s);
			s.istart = s2.istart;
			s.iend = s2.iend;
			s.wmeasure = s2.wmeasure;
			s.a_meter = s2.a_meter
		}
		insert_meter &= ~1		// no meter any more
	}

	/* add bar if needed (for repeat bracket) */
	for (v = 0; v < nv; v++) {

		// if bar already, keep it in sequence
		p_voice = voice_tb[v];
		if (last_s && last_s.v == v && last_s.type == BAR) {
			p_voice.last_sym = last_s;
			last_s = last_s.ts_next
			continue
		}

		s2 = p_voice.bar_start
		if (!s2)
			continue
		p_voice.bar_start = null
		if (cur_sy.voices[v].range < 0
		 || !cur_sy.st_print[cur_sy.voices[v].st])
			continue

		s2.next = p_voice.last_sym.next
		if (s2.next)
			s2.next.prev = s2;
		p_voice.last_sym.next = s2;
		s2.prev = p_voice.last_sym;
		p_voice.last_sym = s2;
		lktsym(s2, last_s);
		s2.time = tsfirst.time
		if (s2.ts_prev.type != s2.type)
			s2.seqst = true;
		if (last_s && last_s.type == s2.type && s2.v != last_s.v) {
			delete last_s.seqst;
			last_s.shrink = 0
		}
	}

	/* if initialization of a new music line, compute the spacing,
	 * including the first (old) sequence */
	set_pitch(last_s);
	for (s = last_s; s; s = s.ts_next) {
		if (s.seqst) {
			for (s = s.ts_next; s; s = s.ts_next)
				if (s.seqst)
					break
			break
		}
	}
	set_allsymwidth(s)	/* set the width of the added symbols */
}

/* -- set a pitch in all symbols and the start/stop of the beams -- */
function set_words(p_voice) {
	var	s, s2, nflags, lastnote,
		start_flag = true,
		pitch = 127			/* no note */

	for (s = p_voice.sym; s; s = s.next) {
		if (s.type == NOTE) {
			pitch = s.notes[0].pit
			break
		}
	}
	for (s = p_voice.sym; s; s = s.next) {
		switch (s.type) {
		case MREST:
			start_flag = true
			break
		case BAR:
			if (!s.beam_on)
				start_flag = true
			if (!s.next && s.prev
//			 && s.prev.type == NOTE
//			 && s.prev.dur >= BASE_LEN * 2)
			 && s.prev.head == OVALBARS)
				s.prev.head = SQUARE
			break
		case NOTE:
		case REST:
			if (s.trem2)
				break
			nflags = s.nflags

			if (s.ntrem)
				nflags += s.ntrem
			if (s.type == REST && s.beam_end) {
				s.beam_end = false;
				start_flag = true
			}
			if (start_flag
			 || nflags <= 0) {
				if (lastnote) {
					lastnote.beam_end = true;
					lastnote = null
				}
				if (nflags <= 0) {
					s.beam_st = true;
					s.beam_end = true
				} else if (s.type == NOTE) {
					s.beam_st = true;
					start_flag = false
				}
			}
			if (s.beam_end)
				start_flag = true
			if (s.type == NOTE)
				lastnote = s
			break
		}
		if (s.type == NOTE) {
			if (s.nhd != 0)
				sort_pitch(s);
			pitch = s.notes[0].pit
//			if (s.prev
//			 && s.prev.type != NOTE) {
//				s.prev.notes[0].pit = (s.prev.notes[0].pit
//						    + pitch) / 2
			for (s2 = s.prev; s2; s2 = s2.prev) {
				if (s2.type != REST)
					break
				s2.notes[0].pit = pitch
			}
		} else {
			if (!s.notes) {
				s.notes = []
				s.notes[0] = {}
				s.nhd = 0
			}
			s.notes[0].pit = pitch
		}
	}
	if (lastnote)
		lastnote.beam_end = true
}

/* -- set the end of the repeat sequences -- */
function set_rb(p_voice) {
	var	s2, mx, n,
		s = p_voice.sym

	while (s) {
		if (s.type != BAR || !s.rbstart || s.norepbra) {
			s = s.next
			continue
		}

		mx = cfmt.rbmax

		/* if 1st repeat sequence, compute the bracket length */
		if (s.text && s.text[0] == '1') {
			n = 0;
			s2 = null
			for (s = s.next; s; s = s.next) {
				if (s.type != BAR)
					continue
				n++
				if (s.rbstop) {
					if (n <= cfmt.rbmax) {
						mx = n;
						s2 = null
					}
					break
				}
				if (n == cfmt.rbmin)
					s2 = s
			}
			if (s2) {
				s2.rbstop = 1;
				mx = cfmt.rbmin
			}
		}
		while (s) {

			/* check repbra shifts (:| | |2 in 2nd staves) */
			if (s.rbstart != 2) {
				s = s.next
				if (!s)
					break
				if (s.rbstart != 2) {
					s = s.next
					if (!s)
						break
					if (s.rbstart != 2)
						break
				}
			}
			n = 0;
			s2 = null
			for (s = s.next; s; s = s.next) {
				if (s.type != BAR)
					continue
				n++
				if (s.rbstop)
					break
				if (!s.next)
					s.rbstop = 2	// right repeat with end
				else if (n == mx)
					s.rbstop = 1	// right repeat without end
			}
		}
	}
}

/* -- initialize the generator -- */
/* this function is called only once per tune  */

var delpit = [0, -7, -14, 0]

function set_global() {
	var p_voice, st, v, nv, sy

	/* get the max number of staves */
	sy = cur_sy;
	st = sy.nstaff;
//	sy.st_print = new Uint8Array(sy.staves.length)
	while (1) {
		sy = sy.next
		if (!sy)
			break
//		sy.st_print = new Uint8Array(sy.staves.length)
		if (sy.nstaff > st)
			st = sy.nstaff
	}
	nstaff = st;

	/* set the pitches, the words (beams) and the repeat brackets */
	nv = voice_tb.length
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v];
		set_words(p_voice)
// (test removed because v.second may change after %%staves)
//		if (!p_voice.second && !p_voice.norepbra)
			set_rb(p_voice)
	}

	/* set the staff of the floating voices */
	set_float();

	// set the clefs and adjust the pitches of all symbol
	set_clefs();
	set_pitch(null)
}

/* -- return the left indentation of the staves -- */
function set_indent(first) {
	var	st, v, w, p_voice, p, i, j, font,
		nv = voice_tb.length,
		maxw = 0

	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (cur_sy.voices[v].range < 0)
			continue
		st = cur_sy.voices[v].st
//		if (!cur_sy.st_print[st])
//			continue
		p = ((first || p_voice.new_name) && p_voice.nm) ?
			p_voice.nm : p_voice.snm
		if (!p)
			continue
		if (!font) {
			font = get_font("voice");
			set_font(font);
		}
		i = 0
		while (1) {
			j = p.indexOf("\\n", i)
			if (j < 0)
				w = strwh(p.slice(i))
			else
				w = strwh(p.slice(i, j))
			w = w[0]
			if (w > maxw)
				maxw = w
			if (j < 0)
				break
			i = j + 1
		}
	}
	if (font)
		maxw += 4 * cwid(' ') * font.swfac;

	w = .5				// (width of left bar)
	for (st = 0; st <= cur_sy.nstaff; st++) {
		if (cur_sy.staves[st].flags
				& (OPEN_BRACE2 | OPEN_BRACKET2)) {
			w = 12
			break
		}
		if (cur_sy.staves[st].flags & (OPEN_BRACE | OPEN_BRACKET))
			w = 6
	}
	maxw += w

	if (first)			// if %%indent
		maxw += cfmt.indent
	return maxw
}

/* -- decide on beams and on stem directions -- */
/* this routine is called only once per tune */
function set_beams(sym) {
	var	s, t, g, beam, s_opp, dy, avg, n, m, mid_p, pu, pd,
		laststem = -1

	for (s = sym; s; s = s.next) {
		if (s.type != NOTE) {
			if (s.type != GRACE)
				continue
			g = s.extra
			if (g.stem == 2) {	/* opposite gstem direction */
				s_opp = s
				continue
			}
			if (!s.stem
			 && (s.stem = s.multi) == 0)
				s.stem = 1
			for (; g; g = g.next) {
				g.stem = s.stem;
				g.multi = s.multi
			}
			continue
		}

		if (!s.stem			/* if not explicitly set */
		 && (s.stem = s.multi) == 0) { /* and alone on the staff */
			mid_p = s.mid / 3 + 18

			/* notes in a beam have the same stem direction */
			if (beam) {
				s.stem = laststem
			} else if (s.beam_st && !s.beam_end) {	// beam start
				beam = true;
				pu = s.notes[s.nhd].pit;
				pd = s.notes[0].pit
				for (g = s.next; g; g = g.next) {
					if (g.type != NOTE)
						continue
					if (g.stem || g.multi) {
						s.stem = g.stem || g.multi
						break
					}
					if (g.notes[g.nhd].pit > pu)
						pu = g.notes[g.nhd].pit
					if (g.notes[0].pit < pd)
						pd = g.notes[0].pit
					if (g.beam_end)
						break
				}
				if (g.beam_end) {
					if ((pu + pd) / 2 < mid_p) {
						s.stem = 1
					} else if ((pu + pd) / 2 > mid_p) {
						s.stem = -1
					} else {
//--fixme: equal: check all notes of the beam
						if (cfmt.bstemdown)
							s.stem = -1
					}
				}
				if (!s.stem)
					s.stem = laststem
			} else {				// no beam
				n = (s.notes[s.nhd].pit + s.notes[0].pit) / 2
				if (n == mid_p) {
					n = 0
					for (m = 0; m <= s.nhd; m++)
						n += s.notes[m].pit;
					n /= (s.nhd + 1)
				}
//				s.stem = n < mid_p ? 1 : -1
				if (n < mid_p)
					s.stem = 1
				else if (n > mid_p)
					s.stem = -1
				else if (cfmt.bstemdown)
					s.stem = -1
				else
					s.stem = laststem
			}
		} else {			/* stem set by set_stem_dir */
			if (s.beam_st && !s.beam_end)
				beam = true
		}
		if (s.beam_end)
			beam = false;
		laststem = s.stem;

		if (s_opp) {			/* opposite gstem direction */
			for (g = s_opp.extra; g; g = g.next)
				g.stem = -laststem;
			s_opp.stem = -laststem;
			s_opp = null
		}
	}
}

// check if there may be one head for unison when voice overlap
function same_head(s1, s2) {
	var i1, i2, l1, l2, head, i11, i12, i21, i22, sh1, sh2

	if (s1.shiftunison && s1.shiftunison >= 3)
		return false
	if ((l1 = s1.dur) >= BASE_LEN)
		return false
	if ((l2 = s2.dur) >= BASE_LEN)
		return false
	if (s1.stemless && s2.stemless)
		return false
	if (s1.dots != s2.dots) {
		if ((s1.shiftunison && (s1.shiftunison & 1))
		 || s1.dots * s2.dots != 0)
			return false
	}
	if (s1.stem * s2.stem > 0)
		return false

	/* check if a common unison */
	i1 = i2 = 0
	if (s1.notes[0].pit > s2.notes[0].pit) {
//fixme:dots
		if (s1.stem < 0)
			return false
		while (s2.notes[i2].pit != s1.notes[0].pit) {
			if (++i2 > s2.nhd)
				return false
		}
	} else if (s1.notes[0].pit < s2.notes[0].pit) {
//fixme:dots
		if (s2.stem < 0)
			return false
		while (s2.notes[0].pit != s1.notes[i1].pit) {
			if (++i1 > s1.nhd)
				return false
		}
	}
	if (s2.notes[i2].acc != s1.notes[i1].acc)
		return false;
	i11 = i1;
	i21 = i2;
	sh1 = s1.notes[i1].shhd;
	sh2 = s2.notes[i2].shhd
	do {
//fixme:dots
		i1++;
		i2++
		if (i1 > s1.nhd) {
//fixme:dots
//			if (s1.notes[0].pit < s2.notes[0].pit)
//				return false
			break
		}
		if (i2 > s2.nhd) {
//fixme:dots
//			if (s1.notes[0].pit > s2.notes[0].pit)
//				return false
			break
		}
		if (s2.notes[i2].acc != s1.notes[i1].acc)
			return false
		if (sh1 < s1.notes[i1].shhd)
			sh1 = s1.notes[i1].shhd
		if (sh2 < s2.notes[i2].shhd)
			sh2 = s2.notes[i2].shhd
	} while (s2.notes[i2].pit == s1.notes[i1].pit)
//fixme:dots
	if (i1 <= s1.nhd) {
		if (i2 <= s2.nhd)
			return false
		if (s2.stem > 0)
			return false
	} else if (i2 <= s2.nhd) {
		if (s1.stem > 0)
			return false
	}
	i12 = i1;
	i22 = i2;

	head = 0
	if (l1 != l2) {
		if (l1 < l2) {
			l1 = l2;
			l2 = s1.dur
		}
		if (l1 < BASE_LEN / 2) {
			if (s2.dots > 0)
				head = 2
			else if (s1.dots > 0)
				head = 1
		} else if (l2 < BASE_LEN / 4) {	/* (l1 >= BASE_LEN / 2) */
//			if ((s1.shiftunison && s1.shiftunison == 2)
//			 || s1.dots != s2.dots)
			if (s1.shiftunison && (s1.shiftunison & 2))
				return false
			head = s2.dur >= BASE_LEN / 2 ? 2 : 1
		} else {
			return false
		}
	}
	if (head == 0)
		head = s1.p_v.scale < s2.p_v.scale ? 2 : 1
	if (head == 1) {
		for (i2 = i21; i2 < i22; i2++) {
			s2.notes[i2].invis = true
			delete s2.notes[i2].acc
		}
		for (i2 = 0; i2 <= s2.nhd; i2++)
			s2.notes[i2].shhd += sh1
	} else {
		for (i1 = i11; i1 < i12; i1++) {
			s1.notes[i1].invis = true
			delete s1.notes[i1].acc
		}
		for (i1 = 0; i1 <= s1.nhd; i1++)
			s1.notes[i1].shhd += sh2
	}
	return true
}

/* handle unison with different accidentals */
function unison_acc(s1, s2, i1, i2) {
	var m, d

	if (!s2.notes[i2].acc) {
		d = w_note[s2.head] * 2 + s2.xmx + s1.notes[i1].shac + 2
		if (s1.notes[i1].micro)
			d += 2
		if (s2.dots)
			d += 6
		for (m = 0; m <= s1.nhd; m++) {
			s1.notes[m].shhd += d;
			s1.notes[m].shac -= d
		}
		s1.xmx += d
	} else {
		d = w_note[s1.head] * 2 + s1.xmx + s2.notes[i2].shac + 2
		if (s2.notes[i2].micro)
			d += 2
		if (s1.dots)
			d += 6
		for (m = 0; m <= s2.nhd; m++) {
			s2.notes[m].shhd += d;
			s2.notes[m].shac -= d
		}
		s2.xmx += d
	}
}

var MAXPIT = 48 * 2

/* set the left space of a note/chord */
function set_left(s) {
	var	m, i, j, shift,
		w_base = w_note[s.head],
		w = w_base,
		left = []

	for (i = 0; i < MAXPIT; i++)
		left.push(-100)

	/* stem */
	if (s.nflags > -2) {
		if (s.stem > 0) {
			w = -w;
			i = s.notes[0].pit * 2;
			j = (Math.ceil((s.ymx - 2) / 3) + 18) * 2
		} else {
			i = (Math.ceil((s.ymn + 2) / 3) + 18) * 2;
			j = s.notes[s.nhd].pit * 2
		}
		if (i < 0)
			i = 0
		if (j >= MAXPIT)
			j = MAXPIT - 1
		while (i <= j)
			left[i++] = w
	}

	/* notes */
	shift = s.notes[s.stem > 0 ? 0 : s.nhd].shhd;	/* previous shift */
	for (m = 0; m <= s.nhd; m++) {
		w = -s.notes[m].shhd + w_base + shift;
		i = s.notes[m].pit * 2
		if (i < 0)
			i = 0
		else if (i >= MAXPIT - 1)
			i = MAXPIT - 2
		if (w > left[i])
			left[i] = w
		if (s.head != SQUARE)
			w -= 1
		if (w > left[i - 1])
			left[i - 1] = w
		if (w > left[i + 1])
			left[i + 1] = w
	}

	return left
}

/* set the right space of a note/chord */
function set_right(s) {
	var	m, i, j, k, shift,
		w_base = w_note[s.head],
		w = w_base,
		flags = s.nflags > 0 && s.beam_st && s.beam_end,
		right = []

	for (i = 0; i < MAXPIT; i++)
		right.push(-100)

	/* stem and flags */
	if (s.nflags > -2) {
		if (s.stem < 0) {
			w = -w;
			i = (Math.ceil((s.ymn + 2) / 3) + 18) * 2;
			j = s.notes[s.nhd].pit * 2;
			k = i + 4
		} else {
			i = s.notes[0].pit * 2;
			j = (Math.ceil((s.ymx - 2) / 3) + 18) * 2
		}
		if (i < 0)
			i = 0
		if (j > MAXPIT)
			j = MAXPIT
		while (i < j)
			right[i++] = w
	}

	if (flags) {
		if (s.stem > 0) {
			if (s.xmx == 0)
				i = s.notes[s.nhd].pit * 2
			else
				i = s.notes[0].pit * 2;
			i += 4
			if (i < 0)
				i = 0
			for (; i < MAXPIT && i <= j - 4; i++)
				right[i] = 11
		} else {
			i = k
			if (i < 0)
				i = 0
			for (; i < MAXPIT && i <= s.notes[0].pit * 2 - 4; i++)
				right[i] = 3.5
		}
	}

	/* notes */
	shift = s.notes[s.stem > 0 ? 0 : s.nhd].shhd	/* previous shift */
	for (m = 0; m <= s.nhd; m++) {
		w = s.notes[m].shhd + w_base - shift;
		i = s.notes[m].pit * 2
		if (i < 0)
			i = 0
		else if (i >= MAXPIT - 1)
			i = MAXPIT - 2
		if (w > right[i])
			right[i] = w
		if (s.head != SQUARE)
			w -= 1
		if (w > right[i - 1])
			right[i - 1] = w
		if (w > right[i + 1])
			right[i + 1] = w
	}

	return right
}

/* -- shift the notes horizontally when voices overlap -- */
/* this routine is called only once per tune */
function set_overlap() {
	var	s, s1, s2, s3, i, i1, i2, m, sd, t, dp,
		d, d2, dr, dr2, dx,
		left1, right1, left2, right2, right3, pl, pr

	// invert the voices
	function v_invert() {
		s1 = s2;
		s2 = s;
		d = d2;
		pl = left1;
		pr = right1;
		dr2 = dr
	}

	for (s = tsfirst; s; s = s.ts_next) {
		if (s.type != NOTE
		 || s.invis)
			continue

		/* treat the stem on two staves with different directions */
		if (s.xstem
		 && s.ts_prev.stem < 0) {
			for (m = 0; m <= s.nhd; m++) {
				s.notes[m].shhd -= 7;		// stem_xoff
				s.notes[m].shac += 16
			}
		}

		/* search the next note at the same time on the same staff */
		s2 = s
		while (1) {
			s2 = s2.ts_next
			if (!s2)
				break
			if (s2.time != s.time) {
				s2 = null
				break
			}
			if (s2.type == NOTE
			 && !s2.invis
			 && s2.st == s.st)
				break
		}
		if (!s2)
			continue
		s1 = s

		/* set the dot vertical offset */
		if (cur_sy.voices[s1.v].range < cur_sy.voices[s2.v].range)
			s2.dot_low = true
		else
			s1.dot_low = true

		/* no shift if no overlap */
		if (s1.ymn > s2.ymx
		 || s1.ymx < s2.ymn)
			continue

		if (same_head(s1, s2))
			continue

		/* compute the minimum space for 's1 s2' and 's2 s1' */
		right1 = set_right(s1);
		left2 = set_left(s2);

		s3 = s1.ts_prev
		if (s3 && s3.time == s1.time
		 && s3.st == s1.st && s3.type == NOTE && !s3.invis) {
			right3 = set_right(s3)
			for (i = 0; i < MAXPIT; i++) {
				if (right3[i] > right1[i])
					right1[i] = right3[i]
			}
		} else {
			s3 = null
		}
		d = -10
		for (i = 0; i < MAXPIT; i++) {
			if (left2[i] + right1[i] > d)
				d = left2[i] + right1[i]
		}
		if (d < -3) {			// no clash if no dots clash
			if (!s1.dots || !s2.dots
			 || !s2.dot_low
			 || s1.stem > 0 || s2.stem < 0
			 || s1.notes[s1.nhd].pit + 2 != s2.notes[0].pit
			 || (s2.notes[0].pit & 1))
				continue
		}

		right2 = set_right(s2);
		left1 = set_left(s1)
		if (s3) {
			right3 = set_left(s3)
			for (i = 0; i < MAXPIT; i++) {
				if (right3[i] > left1[i])
					left1[i] = right3[i]
			}
		}
		d2 = dr = dr2 = -100
		for (i = 0; i < MAXPIT; i++) {
			if (left1[i] + right2[i] > d2)
				d2 = left1[i] + right2[i]
			if (right2[i] > dr2)
				dr2 = right2[i]
			if (right1[i] > dr)
				dr = right1[i]
		}

		/* check for unison with different accidentals
		 * and clash of dots */
		t = 0;
		i1 = s1.nhd;
		i2 = s2.nhd
		while (1) {
			dp = s1.notes[i1].pit - s2.notes[i2].pit
			switch (dp) {
			case 0:
				if (s1.notes[i1].acc != s2.notes[i2].acc) {
					t = -1
					break
				}
				if (s2.notes[i2].acc)
					s2.notes[i2].acc = 0
				if (s1.dots && s2.dots
				 && (s1.notes[i1].pit & 1))
					t = 1
				break
			case -1:
//fixme:dots++
//				if (s1.dots && s2.dots)
//					t = 1
//++--
				if (s1.dots && s2.dots) {
					if (s1.notes[i1].pit & 1) {
						s1.dot_low = false;
						s2.dot_low = false
					} else {
						s1.dot_low = true;
						s2.dot_low = true
					}
				}
//fixme:dots--
				break
			case -2:
				if (s1.dots && s2.dots
				 && !(s1.notes[i1].pit & 1)) {
//fixme:dots++
//					t = 1
//++--
					s1.dot_low = false;
					s2.dot_low = false
//fixme:dots--
					break
				}
				break
			}
			if (t < 0)
				break
			if (dp >= 0) {
				if (--i1 < 0)
					break
			}
			if (dp <= 0) {
				if (--i2 < 0)
					break
			}
		}

		if (t < 0) {	/* unison and different accidentals */
			unison_acc(s1, s2, i1, i2)
			continue
		}

		sd = 0;
		if (s1.dots) {
			if (s2.dots) {
				if (!t)			/* if no dot clash */
					sd = 1		/* align the dots */
//fixme:dots
			}
		} else if (s2.dots) {
			if (d2 + dr < d + dr2)
				sd = 1		/* align the dots */
//fixme:dots
		}
		pl = left2;
		pr = right2
		if (!s3 && d2 + dr < d + dr2)
			v_invert()
		d += 3
		if (d < 0)
			d = 0;			// (not return!)

		/* handle the previous shift */
		m = s1.stem >= 0 ? 0 : s1.nhd;
		d += s1.notes[m].shhd;
		m = s2.stem >= 0 ? 0 : s2.nhd;
		d -= s2.notes[m].shhd

		/*
		 * room for the dots
		 * - if the dots of v1 don't shift, adjust the shift of v2
		 * - otherwise, align the dots and shift them if clash
		 */
		if (s1.dots) {
			dx = 7.7 + s1.xmx +		// x 1st dot
				3.5 * s1.dots - 3.5 +	// x last dot
				3;			// some space
			if (!sd) {
				d2 = -100;
				for (i1 = 0; i1 <= s1.nhd; i1++) {
					i = s1.notes[i1].pit
					if (!(i & 1)) {
						if (!s1.dot_low)
							i++
						else
							i--
					}
					i *= 2
					if (i < 1)
						i = 1
					else if (i >= MAXPIT - 1)
						i = MAXPIT - 2
					if (pl[i] > d2)
						d2 = pl[i]
					if (pl[i - 1] + 1 > d2)
						d2 = pl[i - 1] + 1
					if (pl[i + 1] + 1 > d2)
						d2 = pl[i + 1] + 1
				}
				if (dx + d2 + 2 > d)
					d = dx + d2 + 2
			} else {
				if (dx < d + dr2 + s2.xmx) {
					d2 = 0
					for (i1 = 0; i1 <= s1.nhd; i1++) {
						i = s1.notes[i1].pit
						if (!(i & 1)) {
							if (!s1.dot_low)
								i++
							else
								i--
						}
						i *= 2
						if (i < 1)
							i = 1
						else if (i >= MAXPIT - 1)
							i = MAXPIT - 2
						if (pr[i] > d2)
							d2 = pr[i]
						if (pr[i - 1] + 1 > d2)
							d2 = pr[i - 1] = 1
						if (pr[i + 1] + 1 > d2)
							d2 = pr[i + 1] + 1
					}
					if (d2 > 4.5
					 && 7.7 + s1.xmx + 2 < d + d2 + s2.xmx)
						s2.xmx = d2 + 3 - 7.7
				}
			}
		}

		for (m = s2.nhd; m >= 0; m--) {
			s2.notes[m].shhd += d
//			if (s2.notes[m].acc
//			 && s2.notes[m].pit < s1.notes[0].pit - 4)
//				s2.notes[m].shac -= d
		}
		s2.xmx += d
		if (sd)
			s1.xmx = s2.xmx		// align the dots
	}
}

/* -- set the stem height -- */
/* this routine is called only once per tune */
function set_stems() {
	var s, s2, g, slen, scale,ymn, ymx, nflags, ymin, ymax

	for (s = tsfirst; s; s = s.ts_next) {
		if (s.type != NOTE) {
			if (s.type != GRACE)
				continue
			ymin = ymax = s.mid
			for (g = s.extra; g; g = g.next) {
				slen = GSTEM
				if (g.nflags > 1)
					slen += 1.2 * (g.nflags - 1);
				ymn = 3 * (g.notes[0].pit - 18);
				ymx = 3 * (g.notes[g.nhd].pit - 18)
				if (s.stem >= 0) {
					g.y = ymn;
					g.ys = ymx + slen;
					ymx = Math.round(g.ys)
				} else {
					g.y = ymx;
					g.ys = ymn - slen;
					ymn = Math.round(g.ys)
				}
				ymx += 2;
				ymn -= 2
				if (ymn < ymin)
					ymin = ymn
				else if (ymx > ymax)
					ymax = ymx;
				g.ymx = ymx;
				g.ymn = ymn
			}
			s.ymx = ymax;
			s.ymn = ymin
			continue
		}

		/* shift notes in chords (need stem direction to do this) */
		set_head_shift(s);

		/* if start or end of beam, adjust the number of flags
		 * with the other end */
		nflags = s.nflags
		if (s.beam_st && !s.beam_end) {
			if (s.feathered_beam)
				nflags = ++s.nflags
			for (s2 = s.next; /*s2*/; s2 = s2.next) {
				if (s2.type == NOTE) {
					if (s.feathered_beam)
						s2.nflags++
					if (s2.beam_end)
						break
				}
			}
/*			if (s2) */
			    if (s2.nflags > nflags)
				nflags = s2.nflags
		} else if (!s.beam_st && s.beam_end) {
//fixme: keep the start of beam ?
			for (s2 = s.prev; /*s2*/; s2 = s2.prev) {
				if (s2.beam_st)
					break
			}
/*			if (s2) */
			    if (s2.nflags > nflags)
				nflags = s2.nflags
		}

		/* set height of stem end */
		slen = cfmt.stemheight
		switch (nflags) {
		case 2: slen += 2; break
		case 3:	slen += 5; break
		case 4:	slen += 10; break
		case 5:	slen += 16; break
		}
		if ((scale = s.p_v.scale) != 1)
			slen *= (scale + 1) * .5;
		ymn = 3 * (s.notes[0].pit - 18)
		if (s.nhd > 0) {
			slen -= 2;
			ymx = 3 * (s.notes[s.nhd].pit - 18)
		} else {
			ymx = ymn
		}
		if (s.ntrem)
			slen += 2 * s.ntrem		/* tremolo */
		if (s.stemless) {
			if (s.stem >= 0) {
				s.y = ymn;
				s.ys = ymx
			} else {
				s.ys = ymn;
				s.y = ymx
			}
			if (nflags == -4)		/* if longa */
				ymn -= 6;
			s.ymx = ymx + 4;
			s.ymn = ymn - 4
		} else if (s.stem >= 0) {
			if (nflags >= 2)
				slen -= 1
			if (s.notes[s.nhd].pit > 26
			 && (nflags <= 0
			  || !s.beam_st
			  || !s.beam_end)) {
				slen -= 2
				if (s.notes[s.nhd].pit > 28)
					slen -= 2
			}
			s.y = ymn
			if (s.notes[0].ti1)
				ymn -= 3;
			s.ymn = ymn - 4;
			s.ys = ymx + slen
			if (s.ys < s.mid)
				s.ys = s.mid;
			s.ymx = (s.ys + 2.5) | 0
		} else {			/* stem down */
			if (s.notes[0].pit < 18
			 && (nflags <= 0
			  || !s.beam_st || !s.beam_end)) {
				slen -= 2
				if (s.notes[0].pit < 16)
					slen -= 2
			}
			s.ys = ymn - slen
			if (s.ys > s.mid)
				s.ys = s.mid;
			s.ymn = (s.ys - 2.5) | 0;
			s.y = ymx
/*fixme:the tie may be lower*/
			if (s.notes[s.nhd].ti1)
				ymx += 3;
			s.ymx = ymx + 4
		}
	}
}

/* -- split up unsuitable bars at end of staff -- */
function check_bar(s) {
	var	bar_type, i, b1, b2,
		p_voice = s.p_v

	/* search the last bar */
	while (s.type == CLEF || s.type == KEY || s.type == METER) {
		if (s.type == METER
		 && s.time > p_voice.sym.time)	/* if not empty voice */
			insert_meter |= 1;	/* meter in the next line */
		s = s.prev
		if (!s)
			return
	}
	if (s.type != BAR)
		return

	if (s.text != undefined) {			// if repeat bar
		p_voice.bar_start = clone(s);
		p_voice.bar_start.bar_type = "["
		delete s.text
		delete s.a_gch
//		return
	}
	bar_type = s.bar_type
	if (bar_type == ":")
		return
	if (bar_type.slice(-1) != ':')	// if not left repeat bar
		return

	if (!p_voice.bar_start)
		p_voice.bar_start = clone(s)
	if (bar_type[0] != ':') {			/* 'xx:' (not ':xx:') */
		if (bar_type == "||:") {
			p_voice.bar_start.bar_type = "|:";
			s.bar_type = "||"
			return
		}
		p_voice.bar_start.bar_type = bar_type
		if (s.prev && s.prev.type == BAR)
			unlksym(s)
		else
			s.bar_type = "|"
		return
	}
	if (bar_type == "::") {
		p_voice.bar_start.bar_type = "|:";
		s.bar_type = ":|"
		return
	}
	if (bar_type == "||:") {
		p_voice.bar_start.bar_type = "|:";
		s.bar_type = "||"
		return
	}

	// '::xx::' -> '::|' and '|::'
//fixme: do the same in abcm2ps
	i = 0
	while (bar_type[i] == ':')
		i++
	if (i < bar_type.length) {
		s.bar_type = bar_type.slice(0, i) + '|';
		i = bar_type.length - 1
		while (bar_type[i] == ':')
			i--;
		p_voice.bar_start.bar_type = '|' + bar_type.slice(i + 1)
	} else {
		i = (bar_type.length / 2) |0;			// '::::' !
		s.bar_type = bar_type.slice(0, i) + '|';
		p_voice.bar_start.bar_type = '|' + bar_type.slice(i)
	}
}

/* -- move the symbols of an empty staff to the next one -- */
function sym_staff_move(st) {
	for (var s = tsfirst; s; s = s.ts_next) {
		if (s.nl)
			break
		if (s.st == st
		 && s.type != CLEF) {
			s.st++;
			s.invis = true
		}
	}
}

// generate a block symbol
var blocks = []		// array of delayed block symbols

function block_gen(s) {
	switch (s.subtype) {
	case "leftmargin":
	case "rightmargin":
	case "pagescale":
	case "pagewidth":
	case "scale":
	case "staffwidth":
		svg_flush();
		set_format(s.subtype, s.param);
		break
	case "ml":
		svg_flush();
		user.img_out(s.text)
		break
	case "newpage":
		blk_flush();
		block.newpage = true;
		blk_out()
		break
	case "sep":
		set_page();
		vskip(s.sk1);
		output.push('<path class="stroke"\n\td="M');
		out_sxsy(s.x, ' ', 0);
		output.push('h' + s.l.toFixed(2) + '"/>\n');
		vskip(s.sk2);
		break
	case "text":
		write_text(s.text, s.opt)
		break
	case "title":
		write_title(s.text, true)
		break
	case "vskip":
		vskip(s.sk);
//		blk_out()
		break
	default:
		error(2, s, 'Block $1 not treated', s.subtype)
		break
	}
}

/* -- define the start and end of a piece of tune -- */
/* tsnext becomes the beginning of the next line */
function set_piece() {
	var	s, last, p_voice, st, v, nst, nv,
		non_empty = [],
		non_empty_gl = [],
		sy = cur_sy

	function reset_staff(st) {
		var	p_staff = staff_tb[st],
			sy_staff = sy.staves[st]

		if (!p_staff)
			p_staff = staff_tb[st] = {}
		p_staff.y = 0;			// staff system not computed yet
		p_staff.stafflines = sy_staff.stafflines;
		p_staff.staffscale = sy_staff.staffscale;
		p_staff.ann_top = p_staff.ann_bot = 0
	} // reset_staff()

	// adjust the empty flag of brace systems
	function set_brace() {
		var	st, i, empty_fl,
			n = sy.staves.length

		// if a system brace has empty and non empty staves, keep all staves
		for (st = 0; st < n; st++) {
			if (!(sy.staves[st].flags & (OPEN_BRACE | OPEN_BRACE2)))
				continue
			empty_fl = 0;
			i = st
			while (st < n) {
				empty_fl |= non_empty[st] ? 1 : 2
				if (sy.staves[st].flags & (CLOSE_BRACE | CLOSE_BRACE2))
					break
				st++
			}
			if (empty_fl == 3) {	// if both empty and not empty staves
				while (i <= st) {
					non_empty[i] = true;
					non_empty_gl[i++] = true
				}
			}
		}
	} // set_brace()

	// set the top and bottom of the staves
	function set_top_bot() {
		var st, p_staff, i, l, hole

		for (st = 0; st <= nstaff; st++) {
			p_staff = staff_tb[st]
			if (!non_empty_gl[st]) {
				p_staff.botbar = p_staff.topbar = 0
				continue
			}
			l = p_staff.stafflines.length;
			p_staff.topbar = 6 * (l - 1)

			for (i = 0; i < l - 1; i++)
				if (p_staff.stafflines[i] != '.')
					break
			p_staff.botline = p_staff.botbar = i * 6
			if (i >= l - 2) {		// 0, 1 or 2 lines
				if (p_staff.stafflines[i] != '.') {
					p_staff.botbar -= 6;
					p_staff.topbar += 6
				} else {		// no line: big bar
					p_staff.botbar -= 12;
					p_staff.topbar += 12
				}
			}
		}
	} // set_top_bot()

	/* reset the staves */
	nstaff = nst = sy.nstaff
	for (st = 0; st <= nst; st++)
		reset_staff(st);

	/*
	 * search the next end of line,
	 * and mark the empty staves
	 */
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.nl) {
//fixme: not useful
//			// delay the next block symbols
//			while (s && s.type == BLOCK) {
//				blocks.push(s);
//				unlksym(s);
//				s = s.ts_next
//			}
			break
		}
		if (!s.ts_next)
			last = s		// keep the last symbol
		switch (s.type) {
		case STAVES:
			set_brace();
			sy.st_print = new Uint8Array(non_empty);
			sy = s.sy;
			nst = sy.nstaff
			if (nstaff < nst) {
				for (st = nstaff + 1; st <= nst; st++)
					reset_staff(st);
				nstaff = nst
			}
			non_empty = []
			continue

		// the block symbols will be treated after music line generation
		case BLOCK:
			blocks.push(s);
			unlksym(s)
			if (last)
				last = s.ts_prev
			continue
		}
		st = s.st
		if (non_empty[st])
			continue
		switch (s.type) {
		case CLEF:
			if (st > nstaff) {	// if clef warning/change for new staff
				staff_tb[st].clef = s;
				unlksym(s)
			}
			break
		case BAR:
			if (!sy.staves[st].staffnonote	// default = 1
			 || sy.staves[st].staffnonote <= 1)
				break
			// fall thru
		case GRACE:
			non_empty_gl[st] = non_empty[st] = true
			break
		case NOTE:
		case REST:
		case SPACE:
		case MREST:
			if (sy.staves[st].staffnonote > 1) {
				non_empty_gl[st] = non_empty[st] = true
			} else if (!s.invis) {
				if (sy.staves[st].staffnonote != 0
				 || s.type == NOTE)
					non_empty_gl[st] = non_empty[st] = true
			}
			break
		}
	}
	tsnext = s;

	/* set the last empty staves */
	set_brace()
//	for (st = 0; st <= nstaff; st++)
//		sy.st_print[st] = non_empty[st];
	sy.st_print = new Uint8Array(non_empty);

	/* define the offsets of the measure bars */
	set_top_bot()

	/* move the symbols of the empty staves to the next staff */
//fixme: could be optimized (use a old->new staff array)
	for (st = 0; st < nstaff; st++) {
		if (!non_empty_gl[st])
			sym_staff_move(st)
	}

	/* let the last empty staff have a full height */
	if (!non_empty_gl[nstaff])
		staff_tb[nstaff].topbar = 0;

	/* initialize the music line */
	init_music_line();

	// keep the array of the staves to be printed
	gene.st_print = new Uint8Array(non_empty_gl)

	// if not the end of the tune, set the end of the music line
	if (tsnext) {
		s = tsnext;
		delete s.nl;
		last = s.ts_prev;
		last.ts_next = null;

		// and the end of the voices
		nv = voice_tb.length
		for (v = 0; v < nv; v++) {
			p_voice = voice_tb[v]
			if (p_voice.sym
			 && p_voice.sym.time <= tsnext.time) {
				for (s = tsnext.ts_prev; s; s = s.ts_prev) {
					if (s.v == v) {
						p_voice.s_next = s.next;
						s.next = null;
						check_bar(s)
						break
					}
				}
				if (s)
					continue
			}
			p_voice.s_next = p_voice.sym;
			p_voice.sym = null
		}
	}

	// if the last symbol is not a bar, add an invisible bar
	if (last.type != BAR) {
		s = add_end_bar(last);
		s.prev = s.ts_prev = last;
		last.ts_next = last.next = s;
		s.shrink = last.wr + 2;	// just a small space before end of staff
		s.space = set_space(s)
		if (s.space < s.shrink
		 && last.type != KEY)
			s.space = s.shrink
	}
}

/* -- position the symbols along the staff -- */
function set_sym_glue(width) {
	var space, beta0, alfa, beta, min, g, spafac, xmax

	/* calculate the whole space of the symbols */
	var	some_grace,
		s = tsfirst,
		xmin = 0,
		x = 0

	while (1) {
		if (s.type == GRACE && !some_grace)
			some_grace = s
		if (s.seqst) {
			space = s.space;
			xmin += s.shrink
			if (space < s.shrink)
				space = s.shrink;
			x += space
//			if (cfmt.stretchstaff)
//				space *= 1.8;
//			xmax += space
		}
		if (!s.ts_next)
			break
		s = s.ts_next
	}

	// can occur when bar alone in a staff system
	if (x == 0) {
		realwidth = 0
		return
	}

	xmax = x
	if (cfmt.stretchstaff)
		xmax *= 1.8;
	/* set max shrink and stretch */
	beta0 = 1			/* max expansion before complaining */

	/* memorize the glue for the last music line */
	if (tsnext
	 && blocks.length == 0 && tsnext.type != BLOCK) { // (abcm2ps compatibility)
		if (x >= width) {
			beta_last = 0
		} else {
			beta_last = (width - x) / (xmax - x)	/* stretch */
			if (beta_last > beta0) {
				if (cfmt.stretchstaff) {
					if (cfmt.linewarn) {
						error(0, s,
							"Line underfull ($1pt of $2pt)",
							(beta0 * xmax + (1 - beta0) * x).toFixed(2),
							width.toFixed(2))
					}
				} else {
					width = x;
					beta_last = 0
				}
			}
		}
	} else {			/* if last music line */
		if (x < width) {
			beta = (width - x) / (xmax - x)	/* stretch */
			if (beta >= beta_last) {
				beta = beta_last * xmax + (1 - beta_last) * x

				/* shrink underfull last line same as previous */
				if (beta < width * (1. - cfmt.stretchlast))
					width = beta
			}
		}
	}

	spafac = width / x;			/* space expansion factor */

	/* define the x offsets of all starting symbols */
	x = xmax = 0;
	s = tsfirst
	while (1) {
		if (s.seqst) {
			space = s.shrink
			if (s.space != 0)
				xmax += s.space * spafac * 1.8;
			x += space;
			xmax += space;
			s.x = x;
			s.xmax = xmax
		}
		if (!s.ts_next)
			break
		s = s.ts_next
	}

	/* calculate the exact glue */
	if (x >= width) {
		beta = 0
		if (x == xmin) {
			alfa = 1			// no extra space
		} else {
			alfa = (x - width) / (x - xmin)		/* shrink */
			if (alfa > 1) {
				error(1, s, "Line too much shrunk $1 $2 $3",
					xmin.toFixed(2),
					x.toFixed(2),
					width.toFixed(2))
// uncomment for staff greater than music line
//				alfa = 1
			}
		}
		realwidth = xmin * alfa + x * (1 - alfa)
	} else {
		alfa = 0
		if (xmax > x)
			beta = (width - x) / (xmax - x)		/* stretch */
		else
			beta = 1				/* (no note) */
		if (beta > beta0) {
			if (!cfmt.stretchstaff)
				beta = 0
		}
		realwidth = xmax * beta + x * (1 - beta)
	}

	/* set the final x offsets */
	s = tsfirst
	if (alfa != 0) {
		if (alfa < 1) {
			x = xmin = 0
			for (; s; s = s.ts_next) {
				if (s.seqst) {
					xmin += s.shrink * alfa;
					x = xmin + s.x * (1 - alfa)
				}
				s.x = x
			}
		} else {
			alfa = realwidth / x;
			x = 0
			for (; s; s = s.ts_next) {
				if (s.seqst)
					x = s.x * alfa;
				s.x = x
			}
		}
	} else {
		x = 0
		for (; s; s = s.ts_next) {
			if (s.seqst)
				x = s.xmax * beta + s.x * (1 - beta);
			s.x = x
		}
	}

	/* set the x offsets of the grace notes */
	for (s = some_grace; s; s = s.ts_next) {
		if (s.type != GRACE)
			continue
		if (s.gr_shift)
			x = s.prev.x + s.prev.wr
				+ Number(cfmt.gracespace[0])
		else
			x = s.x - s.wl + Number(cfmt.gracespace[0])
		for (g = s.extra; g; g = g.next)
			g.x += x
	}
}

// set the starting symbols of the voices for the new music line
function set_sym_line() {
	var	p_voice, s, v,
		nv = voice_tb.length

	// set the first symbol of each voice
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v];
		s = p_voice.s_next;		// (set in set_piece)
		p_voice.sym = s
		if (s)
			s.prev = null
	}
}

// set the left offset the images
function set_posx() {
	posx = img.lm / cfmt.scale
}

// initialize the start of generation / new music line
// and output the inter-staff blocks if any
function gen_init() {
	var	s = tsfirst,
		tim = s.time

	for ( ; s; s = s.ts_next) {
		if (s.time != tim) {
			set_page()
			return
		}
		switch (s.type) {
		case NOTE:
		case REST:
		case MREST:
			set_page()
			return
		default:
			continue
		case STAVES:
			cur_sy = s.sy
			break
		case BLOCK:
			block_gen(s)
			break
		}
		unlksym(s)
		if (s.p_v.s_next == s)
			s.p_v.s_next = s.next
	}
	tsfirst = null			/* no more notes */
}

/* -- generate the music -- */
function output_music() {
	var output_sav, v, lwidth, indent, line_height

	gen_init()
	if (!tsfirst)
		return
	set_global()
	if (voice_tb.length > 1) {	/* if many voices */
		set_stem_dir()		/* set the stems direction in 'multi' */
	}

	for (v = 0; v < voice_tb.length; v++)
		set_beams(voice_tb[v].sym);	/* decide on beams */

	set_stems()			/* set the stem lengths */
	if (voice_tb.length > 1) {	/* if many voices */
		set_rest_offset();	/* set the vertical offset of rests */
		set_overlap();		/* shift the notes on voice overlap */
//		set_rp_bars()		// set repeat bars
	}
	set_acc_shft();			// set the horizontal offset of accidentals

	set_allsymwidth(null);		/* set the width of all symbols */

	indent = set_indent(true)

	/* if single line, adjust the page width */
	if (cfmt.singleline) {
		v = get_ck_width();
		lwidth = indent + v[0] + v[1] + get_width(tsfirst, null);
		img.width = lwidth * cfmt.scale + img.lm + img.rm + 2
	} else {

	/* else, split the tune into music lines */
		lwidth = get_lwidth();
		cut_tune(lwidth, indent)
	}

	beta_last = 0.2
	while (1) {				/* loop per music line */
		set_piece();
		set_sym_glue(lwidth - indent)
		if (realwidth != 0) {
			if (indent != 0)
				posx += indent;
			output_sav = output;
			output = undefined;
			draw_sym_near();		// delayed output
			output = output_sav;
			line_height = set_staff();
			delayed_update();
			draw_systems(indent);
			draw_all_sym();
			vskip(line_height)
			if (indent != 0) {
				posx -= indent;
				insert_meter &= ~2	// no more indentation
			}
			while (blocks.length != 0)
				block_gen(blocks.shift())
		}

		tsfirst = tsnext
		svg_flush()
		if (!tsnext)
			break

		// next line
		gen_init()
		if (!tsfirst)
			break
		tsfirst.ts_prev = null;
		set_sym_line();
		lwidth = get_lwidth()	// the image size may have changed
		indent = set_indent()
	}
}

/* -- reset the generator -- */
function reset_gen() {
	insert_meter = cfmt.writefields.indexOf('M') >= 0 ?
				3 :	/* insert meter and indent */
				2	/* indent only */
}
