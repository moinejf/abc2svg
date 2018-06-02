// abc2svg - draw.js - draw functions
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

// constants
var	STEM_MIN	= 16,	/* min stem height under beams */
	STEM_MIN2	= 14,	/* ... for notes with two beams */
	STEM_MIN3	= 12,	/* ... for notes with three beams */
	STEM_MIN4	= 10,	/* ... for notes with four beams */
	STEM_CH_MIN	= 14,	/* min stem height for chords under beams */
	STEM_CH_MIN2	= 10,	/* ... for notes with two beams */
	STEM_CH_MIN3	= 9,	/* ... for notes with three beams */
	STEM_CH_MIN4	= 9,	/* ... for notes with four beams */
	BEAM_DEPTH	= 3.2,	/* width of a beam stroke */
	BEAM_OFFSET	= .25,	/* pos of flat beam relative to staff line */
	BEAM_SHIFT	= 5,	/* shift of second and third beams */
	BEAM_SLOPE	= .4,	/* max slope of a beam */
	BEAM_STUB	= 8,	/* length of stub for flag under beam */ 
	SLUR_SLOPE	= .5,	/* max slope of a slur */
	GSTEM		= 15,	/* grace note stem length */
	GSTEM_XOFF	= 2.3	/* x offset for grace note stem */

    var cache

/* -- compute the best vertical offset for the beams -- */
function b_pos(grace, stem, nflags, b) {
	var	top, bot, d1, d2,
		shift = !grace ? BEAM_SHIFT : 3.5,
		depth = !grace ? BEAM_DEPTH : 1.8

	/* -- up/down shift needed to get k*6 -- */
	function rnd6(y) {
		var iy = Math.round((y + 12) / 6) * 6 - 12
		return iy - y
	} // rnd6()

	if (stem > 0) {
		bot = b - (nflags - 1) * shift - depth
		if (bot > 26)
			return 0
		top = b
	} else {
		top = b + (nflags - 1) * shift + depth
		if (top < -2)
			return 0
		bot = b
	}

	d1 = rnd6(top - BEAM_OFFSET);
	d2 = rnd6(bot + BEAM_OFFSET)
	return d1 * d1 > d2 * d2 ? d2 : d1
}

/* duplicate a note for beaming continuation */
function sym_dup(s_orig) {
	var	m, note,
		s = clone(s_orig);

	s.invis = true
	delete s.text
	delete s.a_gch
	delete s.a_ly
	delete s.a_dd;
	s.notes = clone(s_orig.notes)
	for (m = 0; m <= s.nhd; m++) {
		note = s.notes[m] = clone(s_orig.notes[m])
		delete note.a_dcn
	}
	return s
}

/* -- calculate a beam -- */
/* (the staves may be defined or not) */
var min_tb = [
	[STEM_MIN, STEM_MIN,
		STEM_MIN2, STEM_MIN3, STEM_MIN4, STEM_MIN4],
	[STEM_CH_MIN, STEM_CH_MIN,
		STEM_CH_MIN2, STEM_CH_MIN3, STEM_CH_MIN4, STEM_CH_MIN4]
]

function calculate_beam(bm, s1) {
	var	s, s2, notes, nflags, st, v, two_staves, two_dir,
		x, y, ys, a, b, stem_err, max_stem_err,
		p_min, p_max, s_closest,
		stem_xoff, scale,
		visible, dy

	if (!s1.beam_st) {	/* beam from previous music line */
		s = sym_dup(s1);
		lkvsym(s, s1);
		lktsym(s, s1);
		s.x -= 12
		if (s.x > s1.prev.x + 12)
			s.x = s1.prev.x + 12;
		s.beam_st = true
		delete s.beam_end;
		s.tmp = true
		delete s.slur_start
		delete s.slur_end;
		s1 = s
	}

	/* search last note in beam */
	notes = nflags = 0;	/* set x positions, count notes and flags */
	two_staves = two_dir = false;
	st = s1.st;
	v = s1.v;
	stem_xoff = s1.grace ? GSTEM_XOFF : 3.5
	for (s2 = s1;  ;s2 = s2.next) {
		if (s2.type == NOTE) {
			if (s2.nflags > nflags)
				nflags = s2.nflags;
			notes++
			if (s2.st != st)
				two_staves = true
			if (s2.stem != s1.stem)
				two_dir = true
			if (!visible && !s2.invis
			 && (!s2.stemless || s2.trem2))
				visible = true
			if (s2.beam_end)
				break
		}
		if (!s2.next) {		/* beam towards next music line */
			for (; ; s2 = s2.prev) {
				if (s2.type == NOTE)
					break
			}
			s = sym_dup(s2);
			s.next = s2.next
			if (s.next)
				s.next.prev = s;
			s2.next = s;
			s.prev = s2;
			s.ts_next = s2.ts_next
			if (s.ts_next)
				s.ts_next.ts_prev = s;
			s2.ts_next = s;
			s.ts_prev = s2
			delete s.beam_st;
			s.beam_end = true;
			s.tmp = true
			delete s.slur_start
			delete s.slur_end
			s.x += 12
			if (s.x < realwidth - 12)
				s.x = realwidth - 12;
			s2 = s;
			notes++
			break
		}
	}

	// at least, must have a visible note with a stem
	if (!visible)
		return false;

	bm.s2 = s2			/* (don't display the flags) */

	if (staff_tb[st].y == 0) {	/* staves not defined */
		if (two_staves)
			return false
	} else {			/* staves defined */
//		if (!two_staves && !s1.grace) {
		if (!two_staves) {
			bm.s1 = s1;	/* beam already calculated */
			bm.a = (s1.ys- s2.ys) / (s1.xs - s2.xs);
			bm.b = s1.ys - s1.xs * bm.a + staff_tb[st].y;
			bm.nflags = nflags
			return true
		}
	}

	s_closest = s1;
	p_min = 100;
	p_max = 0
	for (s = s1; ; s = s.next) {
		if (s.type != NOTE)
			continue
		if ((scale = s.p_v.scale) == 1)
			scale = staff_tb[s.st].staffscale
		if (s.stem >= 0) {
			x = stem_xoff + s.notes[0].shhd
			if (s.notes[s.nhd].pit > p_max) {
				p_max = s.notes[s.nhd].pit;
				s_closest = s
			}
		} else {
			x = -stem_xoff + s.notes[s.nhd].shhd
			if (s.notes[0].pit < p_min) {
				p_min = s.notes[0].pit;
				s_closest = s
			}
		}
		s.xs = s.x + x * scale;
		if (s == s2)
			break
	}

	// have flat beams when asked
	if (cfmt.flatbeams)
		a = 0

	// if a note inside the beam is the closest to the beam, the beam is flat
	else if (!two_dir
	      && notes >= 3
	      && s_closest != s1 && s_closest != s2)
		a = 0

	y = s1.ys + staff_tb[st].y
	if (a == undefined)
		a = (s2.ys + staff_tb[s2.st].y - y) / (s2.xs - s1.xs)

	if (a != 0) {
		if (a > 0)
			a = BEAM_SLOPE * a / (BEAM_SLOPE + a) // max steepness for beam
		else
			a = BEAM_SLOPE * a / (BEAM_SLOPE - a);
	}

	b = y - a * s1.xs;

/*fixme: have a look again*/
	/* have room for the symbols in the staff */
	max_stem_err = 0;		/* check stem lengths */
	s = s1
	if (two_dir) {				/* 2 directions */
/*fixme: more to do*/
		ys = ((s1.grace ? 3.5 : BEAM_SHIFT) * (nflags - 1) +
			BEAM_DEPTH) * .5
		if (s1.stem != s2.stem && s1.nflags < s2.nflags)
			ys *= s2.stem
		else
			ys *= s1.stem;
		b += ys
	} else if (!s1.grace) {		/* normal notes */
		var beam_h = BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
//--fixme: added for abc2svg
		while (s.ts_prev
		    && s.ts_prev.type == NOTE
		    && s.ts_prev.time == s.time
		    && s.ts_prev.x > s1.xs)
			s = s.ts_prev

		for (; s && s.time <= s2.time; s = s.ts_next) {
			if (s.type != NOTE
			 || s.invis
			 || (s.st != st
			  && s.v != v)) {
				continue
			}
			x = s.v == v ? s.xs : s.x;
			ys = a * x + b - staff_tb[s.st].y
			if (s.v == v) {
				stem_err = min_tb[s.nhd == 0 ? 0 : 1][s.nflags]
				if (s.stem > 0) {
					if (s.notes[s.nhd].pit > 26) {
						stem_err -= 2
						if (s.notes[s.nhd].pit > 28)
							stem_err -= 2
					}
					stem_err -= ys - 3 * (s.notes[s.nhd].pit - 18)
				} else {
					if (s.notes[0].pit < 18) {
						stem_err -= 2
						if (s.notes[0].pit < 16)
							stem_err -= 2
					}
					stem_err -= 3 * (s.notes[0].pit - 18) - ys
				}
				stem_err += BEAM_DEPTH + BEAM_SHIFT * (s.nflags - 1)
			} else {
/*fixme: KO when two_staves*/
				if (s1.stem > 0) {
					if (s.stem > 0) {
/*fixme: KO when the voice numbers are inverted*/
						if (s.ymn > ys + 4
						 || s.ymx < ys - beam_h - 2)
							continue
						if (s.v > v)
							stem_err = s.ymx - ys
						else
							stem_err = s.ymn + 8 - ys
					} else {
						stem_err = s.ymx - ys
					}
				} else {
					if (s.stem < 0) {
						if (s.ymx < ys - 4
						 || s.ymn > ys - beam_h - 2)
							continue
						if (s.v < v)
							stem_err = ys - s.ymn
						else
							stem_err = ys - s.ymx + 8
					} else {
						stem_err = ys - s.ymn
					}
				}
				stem_err += 2 + beam_h
			}
			if (stem_err > max_stem_err)
				max_stem_err = stem_err
		}
	} else {				/* grace notes */
		for ( ; ; s = s.next) {
			ys = a * s.xs + b - staff_tb[s.st].y;
			stem_err = GSTEM - 2
			if (s.stem > 0)
				stem_err -= ys - (3 * (s.notes[s.nhd].pit - 18))
			else
				stem_err += ys - (3 * (s.notes[0].pit - 18));
			stem_err += 3 * (s.nflags - 1)
			if (stem_err > max_stem_err)
				max_stem_err = stem_err
			if (s == s2)
				break
		}
	}

	if (max_stem_err > 0)		/* shift beam if stems too short */
		b += s1.stem * max_stem_err

	/* have room for the gracenotes, bars and clefs */
/*fixme: test*/
    if (!two_staves && !two_dir)
	for (s = s1.next; ; s = s.next) {
		var g
		switch (s.type) {
		case REST:		/* cannot move rests in multi-voices */
			g = s.ts_next
			if (!g || g.st != st
			 || (g.type != NOTE && g.type != REST))
				break
//fixme:too much vertical shift if some space above the note
//fixme:this does not fix rest under beam in second voice (ts_prev)
			/*fall thru*/
		case BAR:
			if (s.invis)
				break
			/*fall thru*/
		case CLEF:
			y = a * s.x + b
			if (s1.stem > 0) {
				y = s.ymx - y
					+ BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
					+ 2
				if (y > 0)
					b += y
			} else {
				y = s.ymn - y
					- BEAM_DEPTH - BEAM_SHIFT * (nflags - 1)
					- 2
				if (y < 0)
					b += y
			}
			break
		case GRACE:
			for (g = s.extra; g; g = g.next) {
				y = a * g.x + b
				if (s1.stem > 0) {
					y = g.ymx - y
						+ BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
						+ 2
					if (y > 0)
						b += y
				} else {
					y = g.ymn - y
						- BEAM_DEPTH - BEAM_SHIFT * (nflags - 1)
						- 2
					if (y < 0)
						b += y
				}
			}
			break
		}
		if (s == s2)
			break
	}

	if (a == 0)		/* shift flat beams onto staff lines */
		b += b_pos(s1.grace, s1.stem, nflags, b - staff_tb[st].y)

	/* adjust final stems and rests under beam */
	for (s = s1; ; s = s.next) {
		switch (s.type) {
		case NOTE:
			s.ys = a * s.xs + b - staff_tb[s.st].y
			if (s.stem > 0) {
				s.ymx = s.ys + 2.5
//fixme: hack
				if (s.ts_prev
				 && s.ts_prev.stem > 0
				 && s.ts_prev.st == s.st
				 && s.ts_prev.ymn < s.ymx
				 && s.ts_prev.x == s.x
				 && s.notes[0].shhd == 0) {
					s.ts_prev.x -= 3;	/* fix stem clash */
					s.ts_prev.xs -= 3
				}
			} else {
				s.ymn = s.ys - 2.5
			}
			break
		case REST:
			y = a * s.x + b - staff_tb[s.st].y
			dy = BEAM_DEPTH + BEAM_SHIFT * (nflags - 1)
				+ (s.head != FULL ? 4 : 9)
			if (s1.stem > 0) {
				y -= dy
				if (s1.multi == 0 && y > 12)
					y = 12
				if (s.y <= y)
					break
			} else {
				y += dy
				if (s1.multi == 0 && y < 12)
					y = 12
				if (s.y >= y)
					break
			}
			if (s.head != FULL)
				y = (((y + 3 + 12) / 6) | 0) * 6 - 12;
			s.y = y
			break
		}
		if (s == s2)
			break
	}

	/* save beam parameters */
	if (staff_tb[st].y == 0)	/* if staves not defined */
		return false
	bm.s1 = s1;
	bm.a = a;
	bm.b = b;
	bm.nflags = nflags
	return true
}

/* -- draw the beams for one word -- */
/* (the staves are defined) */
function draw_beams(bm) {
	var	s, i, beam_dir, shift, bshift, bstub, bh, da,
		k, k1, k2, x1,
		s1 = bm.s1,
		s2 = bm.s2

	/* -- draw a single beam -- */
	function draw_beam(x1, x2, dy, h, bm,
				 n) {		/* beam number (1..n) */
		var	y1, dy2,
			s = bm.s1,
			nflags = s.nflags

		if (s.ntrem)
			nflags -= s.ntrem
		if (s.trem2 && n > nflags) {
			if (s.dur >= BASE_LEN / 2) {
				x1 = s.x + 6;
				x2 = bm.s2.x - 6
			} else if (s.dur < BASE_LEN / 4) {
				x1 += 5;
				x2 -= 6
			}
		}

		y1 = bm.a * x1 + bm.b - dy;
		x2 -= x1;
	//--fixme: scale (bm.a already scaled!)
		x2 /= stv_g.scale;
		dy2 = bm.a * x2 * stv_g.scale;
		xypath(x1, y1, true);
		output += 'l' + x2.toFixed(2) + ' ' + (-dy2).toFixed(2) +
			'v' + h.toFixed(2) +
			'l' + (-x2).toFixed(2) + ' ' + dy2.toFixed(2) +
			'z"/>\n'
	} // draw_beam()

	anno_start(s1, 'beam')
/*fixme: KO if many staves with different scales*/
//	set_scale(s1)
	if (!s1.grace) {
		bshift = BEAM_SHIFT;
		bstub = BEAM_STUB;
		shift = .34;		/* (half width of the stem) */
		bh = BEAM_DEPTH
	} else {
		bshift = 3.5;
		bstub = 3.2;
		shift = .29;
		bh = 1.8
	}

/*fixme: quick hack for stubs at end of beam and different stem directions*/
	beam_dir = s1.stem
	if (s1.stem != s2.stem
	 && s1.nflags < s2.nflags)
		beam_dir = s2.stem
	if (beam_dir < 0)
		bh = -bh;

	/* make first beam over whole word and adjust the stem lengths */
	draw_beam(s1.xs - shift, s2.xs + shift, 0, bh, bm, 1);
	da = 0
	for (s = s1; ; s = s.next) {
		if (s.type == NOTE
		 && s.stem != beam_dir)
			s.ys = bm.a * s.xs + bm.b
				- staff_tb[s.st].y
				+ bshift * (s.nflags - 1) * s.stem
				- bh
		if (s == s2)
			break
	}

	if (s1.feathered_beam) {
		da = bshift / (s2.xs - s1.xs)
		if (s1.feathered_beam > 0) {
			da = -da;
			bshift = da * s1.xs
		} else {
			bshift = da * s2.xs
		}
		da = da * beam_dir
	}

	/* other beams with two or more flags */
	shift = 0
	for (i = 2; i <= bm.nflags; i++) {
		shift += bshift
		if (da != 0)
			bm.a += da
		for (s = s1; ; s = s.next) {
			if (s.type != NOTE
			 || s.nflags < i) {
				if (s == s2)
					break
				continue
			}
			if (s.trem1
			 && i > s.nflags - s.ntrem) {
				x1 = (s.dur >= BASE_LEN / 2) ? s.x : s.xs;
				draw_beam(x1 - 5, x1 + 5,
					  (shift + 2.5) * beam_dir,
					  bh, bm, i)
				if (s == s2)
					break
				continue
			}
			k1 = s
			while (1) {
				if (s == s2)
					break
				k = s.next
				if (k.type == NOTE || k.type == REST) {
					if (k.trem1){
						if (k.nflags - k.ntrem < i)
							break
					} else if (k.nflags < i) {
						break
					}
				}
				if (k.beam_br1
				 || (k.beam_br2 && i > 2))
					break
				s = k
			}
			k2 = s
			while (k2.type != NOTE)
				k2 = k2.prev;
			x1 = k1.xs
			if (k1 == k2) {
				if (k1 == s1) {
					x1 += bstub
				} else if (k1 == s2) {
					x1 -= bstub
				} else if (k1.beam_br1
				        || (k1.beam_br2
					 && i > 2)) {
					x1 += bstub
				} else {
					k = k1.next
					while (k.type != NOTE)
						k = k.next
					if (k.beam_br1
					 || (k.beam_br2 && i > 2)) {
						x1 -= bstub
					} else {
						k1 = k1.prev
						while (k1.type != NOTE)
							k1 = k1.prev
						if (k1.nflags < k.nflags
						 || (k1.nflags == k.nflags
						  && k1.dots < k.dots))
							x1 += bstub
						else
							x1 -= bstub
					}
				}
			}
			draw_beam(x1, k2.xs,
				  shift * beam_dir,
				  bh, bm, i)
			if (s == s2)
				break
		}
	}
	if (s1.tmp)
		unlksym(s1)
	else if (s2.tmp)
		unlksym(s2)
	anno_stop(s1, 'beam')
}

/* -- draw the left side of the staves -- */
function draw_lstaff(x) {
//	if (cfmt.alignbars)
//		return
	var	i, j, yb, h,
		nst = cur_sy.nstaff,
		l = 0

	/* -- draw a system brace or bracket -- */
	function draw_sysbra(x, st, flag) {
		var i, st_end, yt, yb

		while (!cur_sy.st_print[st]) {
			if (cur_sy.staves[st].flags & flag)
				return
			st++
		}
		i = st_end = st
		while (1) {
			if (cur_sy.st_print[i])
				st_end = i
			if (cur_sy.staves[i].flags & flag)
				break
			i++
		}
		yt = staff_tb[st].y + staff_tb[st].topbar
					* staff_tb[st].staffscale;
		yb = staff_tb[st_end].y + staff_tb[st_end].botbar
					* staff_tb[st_end].staffscale
		if (flag & (CLOSE_BRACE | CLOSE_BRACE2))
			out_brace(x, yb, yt - yb)
		else
			out_bracket(x, yt, yt - yb)
	}

	for (i = 0; ; i++) {
		if (cur_sy.staves[i].flags & (OPEN_BRACE | OPEN_BRACKET))
			l++
		if (cur_sy.st_print[i])
			break
		if (cur_sy.staves[i].flags & (CLOSE_BRACE | CLOSE_BRACKET))
			l--
		if (i == nst)
			break
	}
	for (j = nst; j > i; j--) {
		if (cur_sy.st_print[j])
			break
	}
	if (i == j && l == 0)
		return
	yb = staff_tb[j].y + staff_tb[j].botbar * staff_tb[j].staffscale;
	h = staff_tb[i].y + staff_tb[i].topbar * staff_tb[i].staffscale - yb;
	xypath(x, yb);
	output += "v" + (-h).toFixed(2) + '"/>\n'
	for (i = 0; i <= nst; i++) {
		if (cur_sy.staves[i].flags & OPEN_BRACE)
			draw_sysbra(x, i, CLOSE_BRACE)
		if (cur_sy.staves[i].flags & OPEN_BRACKET)
			draw_sysbra(x, i, CLOSE_BRACKET)
		if (cur_sy.staves[i].flags & OPEN_BRACE2)
			draw_sysbra(x - 6, i, CLOSE_BRACE2)
		if (cur_sy.staves[i].flags & OPEN_BRACKET2)
			draw_sysbra(x - 6, i, CLOSE_BRACKET2)
	}
}

/* -- draw the time signature -- */
function draw_meter(x, s) {
	if (!s.a_meter)
		return
	var	dx, i, j, tmp1, tmp2,
		st = s.st,
		p_staff = staff_tb[st],
		y = p_staff.y;

	// adjust the vertical offset according to the staff definition
	if (p_staff.stafflines != '|||||')
		y += (p_staff.topbar + p_staff.botbar) / 2 - 12	// bottom

	for (i = 0; i < s.a_meter.length; i++) {
		var	f,
			meter = s.a_meter[i]

		x = s.x + s.x_meter[i]

		if (meter.bot) {
			tmp1 = tmp2 = ''
			for (j = 0; j < meter.top.length; j++)
				tmp1 += tgls["meter" + meter.top[j]].c
			for (j = 0; j < meter.bot.length; j++)
				tmp2 += tgls["meter" + meter.bot[j]].c;
			out_XYAB('<g transform="translate(X,Y)" text-anchor="middle">\n\
	<text y="-12">A</text>\n\
	<text>B</text>\n\
</g>\n', x, y + 6, tmp1, tmp2)
		} else {
			switch (meter.top[0]) {
			case 'C':
				f = meter.top[1] != '|' ? "csig" : "ctsig";
				x -= 5;
				y += 12
				break
			case 'c':
				f = meter.top[1] != '.' ? "imsig" : "iMsig"
				break
			case 'o':
				f = meter.top[1] != '.' ? "pmsig" : "pMsig"
				break
			default:
				tmp1 = ''
				for (j = 0; j < meter.top.length; j++)
					tmp1 += tgls["meter" + meter.top[j]].c;
				out_XYAB('\
<text x="X" y="Y" text-anchor="middle">A</text>\n',
					x, y + 12, tmp1)
				break
			}
		}
		if (f)
			xygl(x, y, f)
	}
}

/* -- draw an accidental -- */
function draw_acc(x, y, acc,
			micro_n,
			micro_d) {
	if (micro_n) {
		if (micro_n == micro_d) {
			acc = acc == -1 ?	// flat
				-2 : 2		// double flat : sharp
		} else if (micro_n * 2 != micro_d) {
			xygl(x, y, "acc" + acc + '_' + micro_n + '_' + micro_d)
			return
		}
	}
	xygl(x, y, "acc" + acc)
}

// draw helper lines between yl and yu
//fixme: double lines when needed for different voices
function draw_hl(x, yl, yu, st, hltype) {
    var	i, j,
	p_staff = staff_tb[st],
	staffb = p_staff.y,
	stafflines = p_staff.stafflines,
	top = (stafflines.length - 1) * 6,
	bot = p_staff.botline

	// no helper if no line
	if (!/[\[|]/.test(stafflines))
		return

	if (yl % 6)
		yl += 3
	if (yu % 6)
		yu -= 3
	if (stafflines.indexOf('-') >= 0	// if forced helper lines ('-')
	 && ((yl > bot && yl < top) || (yu > bot && yu < top)
	  || (yl <= bot && yu >= top))) {
		i = yl;
		j = yu
		while (i > bot && stafflines[i / 6] == '-')
			i -= 6
		while (j < top && stafflines[j / 6] == '-')
			j += 6
		for ( ; i < j; i += 6) {
			if (stafflines[i / 6] == '-')
				xygl(x, staffb + i, hltype)	// hole
		}
	}
	for (; yl < bot; yl += 6)
		xygl(x, staffb + yl, hltype)
	for (; yu > top; yu -= 6)
		xygl(x, staffb + yu, hltype)
}

/* -- draw a key signature -- */
var	sharp_cl = new Int8Array([24, 9, 15, 21, 6, 12, 18]),
	flat_cl = new Int8Array([12, 18, 24, 9, 15, 21, 6]),
	sharp1 = new Int8Array([-9, 12, -9, -9, 12, -9]),
	sharp2 = new Int8Array([12, -9, 12, -9, 12, -9]),
	flat1 = new Int8Array([9, -12, 9, -12, 9, -12]),
	flat2 = new Int8Array([-12, 9, -12, 9, -12, 9])

function draw_keysig(p_voice, x, s) {
	if (s.k_none)
		return
	var	old_sf = s.k_old_sf,
		st = p_voice.st,
		staffb = staff_tb[st].y,
		i, shift, p_seq,
		clef_ix = s.k_y_clef

	if (clef_ix & 1)
		clef_ix += 7;
	clef_ix /= 2
	while (clef_ix < 0)
		clef_ix += 7;
	clef_ix %= 7

	/* normal accidentals */
	if (!s.k_a_acc) {

		/* put neutrals if 'accidental cancel' */
		if (cfmt.cancelkey || s.k_sf == 0) {

			/* when flats to sharps, or sharps to flats, */
			if (s.k_sf == 0
			 || old_sf * s.k_sf < 0) {

				/* old sharps */
				shift = sharp_cl[clef_ix];
				p_seq = shift > 9 ? sharp1 : sharp2
				for (i = 0; i < old_sf; i++) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[i];
					x += 5.5
				}

				/* old flats */
				shift = flat_cl[clef_ix];
				p_seq = shift < 18 ? flat1 : flat2
				for (i = 0; i > old_sf; i--) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[-i];
					x += 5.5
				}
				if (s.k_sf != 0)
					x += 3		/* extra space */
			}
		}

		/* new sharps */
		if (s.k_sf > 0) {
			shift = sharp_cl[clef_ix];
			p_seq = shift > 9 ? sharp1 : sharp2
			for (i = 0; i < s.k_sf; i++) {
				xygl(x, staffb + shift, "acc1");
				shift += p_seq[i];
				x += 5.5
			}
			if (cfmt.cancelkey && i < old_sf) {
				x += 2
				for (; i < old_sf; i++) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[i];
					x += 5.5
				}
			}
		}

		/* new flats */
		if (s.k_sf < 0) {
			shift = flat_cl[clef_ix];
			p_seq = shift < 18 ? flat1 : flat2
			for (i = 0; i > s.k_sf; i--) {
				xygl(x, staffb + shift, "acc-1");
				shift += p_seq[-i];
				x += 5.5
			}
			if (cfmt.cancelkey && i > old_sf) {
				x += 2
				for (; i > old_sf; i--) {
					xygl(x, staffb + shift, "acc3");
					shift += p_seq[-i];
					x += 5.5
				}
			}
		}
	} else if (s.k_a_acc.length) {

		/* explicit accidentals */
		var	acc,
			last_acc = s.k_a_acc[0].acc,
			last_shift = 100

		for (i = 0; i < s.k_a_acc.length; i++) {
			acc = s.k_a_acc[i];
			shift = (s.k_y_clef	// clef shift
				+ acc.pit - 18) * 3
			if (i != 0
			 && (shift > last_shift + 18
			  || shift < last_shift - 18))
				x -= 5.5		// no clash
			else if (acc.acc != last_acc)
				x += 3;
			last_acc = acc.acc;
			draw_hl(x, shift, shift, st, "hl");
			last_shift = shift;
			draw_acc(x, staffb + shift,
				 acc.acc, acc.micro_n, acc.micro_d);
			x += 5.5
		}
	}
}

/* -- convert the standard measure bars -- */
function bar_cnv(bar_type) {
	switch (bar_type) {
	case "[":
	case "[]":
		return ""			/* invisible */
	case "|:":
	case "|::":
	case "|:::":
		return "[" + bar_type		/* |::: -> [|::: */
	case ":|":
	case "::|":
	case ":::|":
		return bar_type + "]"		/* :..| -> :..|] */
	case "::":
		return cfmt.dblrepbar		/* :: -> double repeat bar */
	case '||:':
		return '[|:'
	}
	return bar_type
}

/* -- draw a measure bar -- */
function draw_bar(s, bot, h) {
	var	i, s2, yb, bar_type,
		st = s.st,
		x = s.x

	bar_type = bar_cnv(s.bar_type)
	if (!bar_type)
		return				/* invisible */

	/* don't put a line between the staves if there is no bar above */
	if (st != 0
	 && s.ts_prev
//fixme: 's.ts_prev.st != st - 1' when floating voice in lower staff
//	 && (s.ts_prev.type != BAR || s.ts_prev.st != st - 1))
	 && s.ts_prev.type != BAR)
		h = staff_tb[st].topbar * staff_tb[st].staffscale;

	s.ymx = s.ymn + h;
	set_sscale(-1);
	anno_start(s)

	/* if measure repeat, draw the '%' like glyphs */
	if (s.bar_mrep) {
		yb = staff_tb[st].y + 12;
		set_sscale(st)
		if (s.bar_mrep == 1) {
			for (s2 = s.prev; s2.type != REST; s2 = s2.prev)
				;
			xygl(s2.x, yb, "mrep")
		} else {
			xygl(x, yb, "mrep2")
			if (s.v == cur_sy.top_voice) {
				set_font("annotation");
				xy_str(x, yb + staff_tb[st].topbar - 9,
						s.bar_mrep.toString(), "c")
			}
		}
	}

	for (i = bar_type.length; --i >= 0; ) {
		switch (bar_type[i]) {
		case "|":
			set_sscale(-1);
			out_bar(x, bot, h, s.bar_dotted)
			break
		default:
//		case "[":
//		case "]":
			x -= 3;
			set_sscale(-1);
			out_thbar(x, bot, h)
			break
		case ":":
			x -= 2;
			set_sscale(st);
			xygl(x + 1, bot, "rdots")
			break
		}
		x -= 3
	}
	set_sscale(-1);
	anno_stop(s)
}

/* -- draw a rest -- */
/* (the staves are defined) */
var rest_tb = [
	"r128", "r64", "r32", "r16", "r8",
	"r4",
	"r2", "r1", "r0", "r00"]

function draw_rest(s) {
	var	s2, i, j, x, y, dotx, staffb, yb, yt, head,
		p_staff = staff_tb[s.st]

	/* don't display the rests of invisible staves */
	/* (must do this here for voices out of their normal staff) */
	if (!p_staff.topbar)
		return

	/* if rest alone in the measure or measure repeat, center */
	if (s.dur == s.p_v.meter.wmeasure
	 || (s.rep_nb && s.rep_nb >= 0)) {

		/* don't use next/prev: there is no bar in voice overlay */
		s2 = s.ts_next
		while (s2 && s2.time != s.time + s.dur)
			s2 = s2.ts_next;
		x = s2 ? s2.x : realwidth;
		s2 = s
		while (!s2.seqst)
			s2 = s2.ts_prev;
		s2 = s2.ts_prev;
		x = (x + s2.x) / 2

		/* center the associated decorations */
		if (s.a_dd)
			deco_update(s, x - s.x);
		s.x = x
	} else {
		x = s.x
		if (s.notes[0].shhd)
			x += s.notes[0].shhd * stv_g.scale
	}
	if (s.invis)
		return

	staffb = p_staff.y			/* bottom of staff */

	if (s.rep_nb) {
		set_sscale(s.st);
		anno_start(s);
		staffb += 12
		if (s.rep_nb < 0) {
			xygl(x, staffb, "srep")
		} else {
			xygl(x, staffb, "mrep")
			if (s.rep_nb > 2 && s.v == cur_sy.top_voice) {
				set_font("annotation");
				xy_str(x, staffb + p_staff.topbar - 9,
					s.rep_nb.toString(), "c")
			}
		}
		anno_stop(s)
		return
	}

	set_scale(s);
	anno_start(s);

	y = s.y;

	i = 5 - s.nflags		/* rest_tb index (5 = C_XFLAGS) */
	if (i == 7 && y == 12
	 && p_staff.stafflines.length <= 2)
		y -= 6				/* semibreve a bit lower */

	// draw the rest
	xygl(x, y + staffb, s.notes[0].head ? s.notes[0].head : rest_tb[i])

	/* output ledger line(s) when greater than minim */
	if (i >= 6) {
		j = y / 6
		switch (i) {
		default:
			switch (p_staff.stafflines[j + 1]) {
			case '|':
			case '[':
				break
			default:
				xygl(x, y + 6 + staffb, "hl1")
				break
			}
			if (i == 9) {			/* longa */
				y -= 6;
				j--
			}
			break
		case 7:					/* semibreve */
			y += 6;
			j++
		case 6:					/* minim */
			break
		}
		switch (p_staff.stafflines[j]) {
		case '|':
		case '[':
			break
		default:
			xygl(x, y + staffb, "hl1")
			break
		}
	}
	x += 8;
	y += staffb + 3
	for (i = 0; i < s.dots; i++) {
		xygl(x, y, "dot");
		x += 3.5
	}
	anno_stop(s)
}

/* -- draw grace notes -- */
/* (the staves are defined) */
function draw_gracenotes(s) {
	var	yy, x0, y0, x1, y1, x2, y2, x3, y3, bet1, bet2,
		dy1, dy2, g, last, note,
		bm = {}

	/* draw the notes */
//	bm.s2 = undefined			/* (draw flags) */
	for (g = s.extra; g; g = g.next) {
		if (g.beam_st && !g.beam_end) {
			if (calculate_beam(bm, g))
				draw_beams(bm)
		}
		anno_start(g);
		draw_note(g, !bm.s2)
		if (g == bm.s2)
			bm.s2 = null			/* (draw flags again) */
		anno_stop(g)
		if (!g.next)
			break			/* (keep the last note) */
	}

	// if an acciaccatura, draw a bar 
	if (s.sappo) {
		g = s.extra
		if (!g.next) {			/* if one note */
			x1 = 9;
			y1 = g.stem > 0 ? 5 : -5
		} else {			/* many notes */
			x1 = (g.next.x - g.x) * .5 + 4;
			y1 = (g.ys + g.next.ys) * .5 - g.y
			if (g.stem > 0)
				y1 -= 1
			else
				y1 += 1
		}
		note = g.notes[g.stem < 0 ? 0 : g.nhd];
		out_acciac(x_head(g, note), y_head(g, note),
				x1, y1, g.stem > 0)
	}

	/* slur */
//fixme: have a full key symbol in voice
	if (s.p_v.key.k_bagpipe			/* no slur when bagpipe */
	 || !cfmt.graceslurs
	 || s.slur_start			/* explicit slur */
	 || !s.next
	 || s.next.type != NOTE)
		return
	last = g
	if (last.stem >= 0) {
		yy = 127
		for (g = s.extra; g; g = g.next) {
			if (g.y < yy) {
				yy = g.y;
				last = g
			}
		}
		x0 = last.x;
		y0 = last.y - 5
		if (s.extra != last) {
			x0 -= 4;
			y0 += 1
		}
		s = s.next;
		x3 = s.x - 1
		if (s.stem < 0)
			x3 -= 4;
		y3 = 3 * (s.notes[0].pit - 18) - 5;
		dy1 = (x3 - x0) * .4
		if (dy1 > 3)
			dy1 = 3;
		dy2 = dy1;
		bet1 = .2;
		bet2 = .8
		if (y0 > y3 + 7) {
			x0 = last.x - 1;
			y0 += .5;
			y3 += 6.5;
			x3 = s.x - 5.5;
			dy1 = (y0 - y3) * .8;
			dy2 = (y0 - y3) * .2;
			bet1 = 0
		} else if (y3 > y0 + 4) {
			y3 = y0 + 4;
			x0 = last.x + 2;
			y0 = last.y - 4
		}
	} else {
		yy = -127
		for (g = s.extra; g; g = g.next) {
			if (g.y > yy) {
				yy = g.y;
				last = g
			}
		}
		x0 = last.x;
		y0 = last.y + 5
		if (s.extra != last) {
			x0 -= 4;
			y0 -= 1
		}
		s = s.next;
		x3 = s.x - 1
		if (s.stem >= 0)
			x3 -= 2;
		y3 = 3 * (s.notes[s.nhd].pit - 18) + 5;
		dy1 = (x0 - x3) * .4
		if (dy1 < -3)
			dy1 = -3;
		dy2 = dy1;
		bet1 = .2;
		bet2 = .8
		if (y0 < y3 - 7) {
			x0 = last.x - 1;
			y0 -= .5;
			y3 -= 6.5;
			x3 = s.x - 5.5;
			dy1 = (y0 - y3) * .8;
			dy2 = (y0 - y3) * .2;
			bet1 = 0
		} else if (y3 < y0 - 4) {
			y3 = y0 - 4;
			x0 = last.x + 2;
			y0 = last.y + 4
		}
	}

	x1 = bet1 * x3 + (1 - bet1) * x0 - x0;
	y1 = bet1 * y3 + (1 - bet1) * y0 - dy1 - y0;
	x2 = bet2 * x3 + (1 - bet2) * x0 - x0;
	y2 = bet2 * y3 + (1 - bet2) * y0 - dy2 - y0;

	anno_start(s, 'slur');
	xypath(x0, y0 + staff_tb[s.st].y);
	output += 'c' + x1.toFixed(2) + ' ' + (-y1).toFixed(2) +
		' ' + x2.toFixed(2) + ' ' + (-y2).toFixed(2) +
		' ' + (x3 - x0).toFixed(2) + ' ' + (-y3 + y0).toFixed(2) + '"/>\n';
	anno_stop(s, 'slur')
}

/* -- set the y offset of the dots -- */
function setdoty(s, y_tb) {
	var m, m1, y

	/* set the normal offsets */
	for (m = 0; m <= s.nhd; m++) {
		y = 3 * (s.notes[m].pit - 18)	/* note height on staff */
		if ((y % 6) == 0) {
			if (s.dot_low)
				y -= 3
			else
				y += 3
		}
		y_tb[m] = y
	}
	/* dispatch and recenter the dots in the staff spaces */
	for (m = 0; m < s.nhd; m++) {
		if (y_tb[m + 1] > y_tb[m])
			continue
		m1 = m
		while (m1 > 0) {
			if (y_tb[m1] > y_tb[m1 - 1] + 6)
				break
			m1--
		}
		if (3 * (s.notes[m1].pit - 18) - y_tb[m1]
				< y_tb[m + 1] - 3 * (s.notes[m + 1].pit - 18)) {
			while (m1 <= m)
				y_tb[m1++] -= 6
		} else {
			y_tb[m + 1] = y_tb[m] + 6
		}
	}
}

// get the x and y position of a note head
// (when the staves are defined)
function x_head(s, note) {
	return s.x + note.shhd
}
function y_head(s, note) {
	return staff_tb[s.st].y + 3 * (note.pit - 18)
}

/* -- draw m-th head with accidentals and dots -- */
/* (the staves are defined) */
// sets {x,y}_note
function draw_basic_note(x, s, m, y_tb) {
	var	i, k, p, yy, dotx, doty,
		old_color = false,
		note = s.notes[m],
		staffb = staff_tb[s.st].y,	/* bottom of staff */
		y = 3 * (note.pit - 18),	/* note height on staff */
		shhd = note.shhd * stv_g.scale,
		x_note = x + shhd,
		y_note = y + staffb

//	/* special case for voice unison */
//	if (s.nohdi1 != undefined
//	 && m >= s.nohdi1 && m < s.nohdi2)
//		return

	var	elts = identify_note(s, note.dur),
		head = elts[0],
		dots = elts[1],
		nflags = elts[2]

	/* output a ledger line if horizontal shift / chord
	 * and note on a line */
	if (y % 6 == 0
	 && shhd != (s.stem > 0 ? s.notes[0].shhd : s.notes[s.nhd].shhd)) {
		yy = 0
		if (y >= 30) {
			yy = y
			if (yy % 6)
				yy -= 3
		} else if (y <= -6) {
			yy = y
			if (yy % 6)
				yy += 3
		}
		if (yy)
			xygl(x_note, yy + staffb, "hl")
	}

	/* draw the head */
	if (note.invis) {
		;
	} else if (s.grace) {			// don't apply %%map to grace notes
		p = "ghd";
		x_note -= 4.5 * stv_g.scale
	} else if (note.map && note.map[0]) {
		i = s.head;
		p = note.map[0][i]		// heads
		if (!p)
			p = note.map[0][note.map[0].length - 1]
		i = p.indexOf('/')
		if (i >= 0) {			// stem dependant
			if (s.stem >= 0)
				p = p.slice(0, i)
			else
				p = p.slice(i + 1)
		}
	} else if (s.type == CUSTOS) {
		p = "custos"
	} else {
		switch (head) {
		case OVAL:
			p = "HD"
			break
		case OVALBARS:
			if (s.head != SQUARE) {
				p = "HDD"
				break
			}
			// fall thru
		case SQUARE:
			p = note.dur < BASE_LEN * 4 ? "breve" : "longa"

			/* don't display dots on last note of the tune */
			if (!tsnext && s.next
			 && s.next.type == BAR && !s.next.next)
				dots = 0
			break
		case EMPTY:
			p = "Hd"		// white note
			break
		default:			// black note
			p = "hd"
			break
		}
	}
	if (note.color != undefined)
		old_color = set_color(note.color)
	else if (note.map && note.map[2])
		old_color = set_color(note.map[2])
	if (p) {
		if (!psxygl(x_note, y_note, p))
			xygl(x_note, y_note, p)
	}

	/* draw the dots */
/*fixme: to see for grace notes*/
	if (dots) {
		dotx = x + (7.7 + s.xmx) * stv_g.scale
		if (y_tb[m] == undefined) {
			y_tb[m] = 3 * (s.notes[m].pit - 18)
			if ((s.notes[m].pit & 1) == 0)
				y_tb[m] += 3
		}
		doty = y_tb[m] + staffb
		while (--dots >= 0) {
			xygl(dotx, doty, "dot");
			dotx += 3.5
		}
	}

	/* draw the accidental */
	if (note.acc) {
		x -= note.shac * stv_g.scale
		if (!s.grace) {
			draw_acc(x, y + staffb,
				 note.acc, note.micro_n, note.micro_d)
		} else {
			g_open(x, y + staffb, 0, .75);
			draw_acc(0, 0, note.acc, note.micro_n, note.micro_d);
			g_close()
		}
	}
	if (old_color != undefined)
		set_color(old_color)
}

/* -- draw a note or a chord -- */
/* (the staves are defined) */
function draw_note(s,
		   fl) {		// draw flags
	var	s2, i, m, y, staffb, slen, c, hltype, nflags,
		x, y, note,
		y_tb = new Array(s.nhd + 1)

	if (s.dots)
		setdoty(s, y_tb)

	note = s.notes[s.stem < 0 ? s.nhd : 0];	// master note head
	x = x_head(s, note);
	staffb = staff_tb[s.st].y

	/* output the ledger lines */
	if (s.grace) {
		hltype = "ghl"
	} else {
		switch (s.head) {
		default:
			hltype = "hl"
			break
		case OVAL:
		case OVALBARS:
			hltype = "hl1"
			break
		case SQUARE:
			hltype = "hl2"
			break
		}
	}
	draw_hl(x, 3 * (s.notes[0].pit - 18), 3 * (s.notes[s.nhd].pit - 18),
		s.st, hltype)

	/* draw the stem and flags */
	y = y_head(s, note)
	if (!s.stemless) {
		slen = s.ys - s.y;
		nflags = s.nflags
		if (s.ntrem)
			nflags -= s.ntrem
		if (!fl || nflags <= 0) {	/* stem only */
			if (s.nflags > 0) {	/* (fix for PS low resolution) */
				if (s.stem >= 0)
					slen -= 1
				else
					slen += 1
			}
			out_stem(x, y, slen, s.grace)
		} else {				/* stem and flags */
			out_stem(x, y, slen, s.grace,
				 nflags, cfmt.straightflags)
		}
	} else if (s.xstem) {				/* cross-staff stem */
		s2 = s.ts_prev;
		slen = (s2.stem > 0 ? s2.y : s2.ys) - s.y;
		slen += staff_tb[s2.st].y - staffb;
/*fixme:KO when different scales*/
		slen /= s.p_v.scale;
		out_stem(x, y, slen)
	}

	/* draw the tremolo bars */
	if (fl && s.trem1) {
		var	ntrem = s.ntrem || 0,
			x1 = x;
		slen = 3 * (s.notes[s.stem > 0 ? s.nhd : 0].pit - 18)
		if (s.head == FULL || s.head == EMPTY) {
			x1 += (s.grace ? GSTEM_XOFF : 3.5) * s.stem
			if (s.stem > 0)
				slen += 6 + 5.4 * ntrem
			else
				slen -= 6 + 5.4
		} else {
			if (s.stem > 0)
				slen += 5 + 5.4 * ntrem
			else
				slen -= 5 + 5.4
		}
		slen /= s.p_v.scale;
		out_trem(x1, staffb + slen, ntrem)
	}

	/* draw the note heads */
	x = s.x
	for (m = 0; m <= s.nhd; m++)
		draw_basic_note(x, s, m, y_tb)
}

/* -- find where to terminate/start a slur -- */
function next_scut(s) {
	var prev = s

	for (s = s.next; s; s = s.next) {
		if (s.rbstop)
			return s
		prev = s
	}
	/*fixme: KO when no note for this voice at end of staff */
	return prev
}

function prev_scut(s) {
	while (s.prev) {
		s = s.prev
		if (s.rbstart)
			return s
	}

	/* return a symbol of any voice starting before the start of the voice */
	s = s.p_v.sym
	while (s.type != CLEF)
		s = s.ts_prev		/* search a main voice */
	if (s.next && s.next.type == KEY)
		s = s.next
	if (s.next && s.next.type == METER)
		return s.next
	return s
}

/* -- decide whether a slur goes up or down -- */
function slur_direction(k1, k2) {
	var s, some_upstem, low

	if (k1.grace && k1.stem > 0)
		return -1

	for (s = k1; ; s = s.next) {
		if (s.type == NOTE) {
			if (!s.stemless) {
				if (s.stem < 0)
					return 1
				some_upstem = true
			}
			if (s.notes[0].pit < 22)	/* if under middle staff */
				low = true
		}
		if (s == k2)
			break
	}
	if (!some_upstem && !low)
		return 1
	return -1
}

/* -- output a slur / tie -- */
function slur_out(x1, y1, x2, y2, dir, height, dotted) {
	var	dx, dy, dz,
		alfa = .3,
		beta = .45;

	/* for wide flat slurs, make shape more square */
	dy = y2 - y1
	if (dy < 0)
		dy = -dy;
	dx = x2 - x1
	if (dx > 40. && dy / dx < .7) {
		alfa = .3 + .002 * (dx - 40.)
		if (alfa > .7)
			alfa = .7
	}

	/* alfa, beta, and height determine Bezier control points pp1,pp2
	 *
	 *           X====alfa===|===alfa=====X
	 *	    /		 |	       \
	 *	  pp1		 |	        pp2
	 *	  /	       height		 \
	 *	beta		 |		 beta
	 *      /		 |		   \
	 *    p1		 m		     p2
	 *
	 */

	var	mx = .5 * (x1 + x2),
		my = .5 * (y1 + y2),
		xx1 = mx + alfa * (x1 - mx),
		yy1 = my + alfa * (y1 - my) + height;
	xx1 = x1 + beta * (xx1 - x1);
	yy1 = y1 + beta * (yy1 - y1)

	var	xx2 = mx + alfa * (x2 - mx),
		yy2 = my + alfa * (y2 - my) + height;
	xx2 = x2 + beta * (xx2 - x2);
	yy2 = y2 + beta * (yy2 - y2);

	dx = .03 * (x2 - x1);
//	if (dx > 10.)
//		dx = 10.
//	dy = 1.6 * dir
	dy = 2 * dir;
	dz = .2 + .001 * (x2 - x1)
	if (dz > .6)
		dz = .6;
	dz *= dir
	
	var scale_y = stv_g.v ? stv_g.scale : 1
	if (!dotted)
		output += '<path class="fill" d="M'
	else
		output += '<path class="stroke" stroke-dasharray="5,5" d="M';
	out_sxsy(x1, ' ', y1);
	output += 'c' +
		((xx1 - x1) / stv_g.scale).toFixed(2) + ' ' +
		((y1 - yy1) / scale_y).toFixed(2) + ' ' +
		((xx2 - x1) / stv_g.scale).toFixed(2) + ' ' +
		((y1 - yy2) / scale_y).toFixed(2) + ' ' +
		((x2 - x1) / stv_g.scale).toFixed(2) + ' ' +
		((y1 - y2) / scale_y).toFixed(2)

	if (!dotted)
		output += '\n\tv' +
			(-dz).toFixed(2) + 'c' +
			((xx2 - dx - x2) / stv_g.scale).toFixed(2) + ' ' +
			((y2 + dz - yy2 - dy) / scale_y).toFixed(2) + ' ' +
			((xx1 + dx - x2) / stv_g.scale).toFixed(2) + ' ' +
			((y2 + dz - yy1 - dy) / scale_y).toFixed(2) + ' ' +
			((x1 - x2) / stv_g.scale).toFixed(2) + ' ' +
			((y2 + dz - y1) / scale_y).toFixed(2);
	output += '"/>\n'
}

/* -- check if slur sequence in a multi-voice staff -- */
function slur_multi(k1, k2) {
	while (1) {
		if (k1.multi)		/* if multi voice */
			/*fixme: may change*/
			return k1.multi
		if (k1 == k2)
			break
		k1 = k1.next
	}
	return 0
}

/* -- draw a phrasing slur between two symbols -- */
/* (the staves are not yet defined) */
/* (delayed output) */
/* (not a pretty routine, this) */
function draw_slur(k1_o, k2, m1, m2, slur_type) {
	var	k1 = k1_o,
		k, g, x1, y1, x2, y2, height, addy,
		a, y, z, h, dx, dy, dir

	while (k1.v != k2.v)
		k1 = k1.ts_next
/*fixme: if two staves, may have upper or lower slur*/
	switch (slur_type & 0x07) {	/* (ignore dotted flag) */
	case SL_ABOVE: dir = 1; break
	case SL_BELOW: dir = -1; break
	default:
		dir = slur_multi(k1, k2)
		if (!dir)
			dir = slur_direction(k1, k2)
		break
	}

	var	nn = 1,
		upstaff = k1.st,
		two_staves = false

	if (k1 != k2) {
		k = k1.next
		while (1) {
			if (k.type == NOTE || k.type == REST) {
				nn++
				if (k.st != upstaff) {
					two_staves = true
					if (k.st < upstaff)
						upstaff = k.st
				}
			}
			if (k == k2)
				break
			k = k.next
		}
	}
/*fixme: KO when two staves*/
if (two_staves) error(2, k1, "*** multi-staves slurs not treated yet");

	/* fix endpoints */
	x1 = k1_o.x
	if (k1_o.notes && k1_o.notes[0].shhd)
		x1 += k1_o.notes[0].shhd
	if (k1_o != k2) {
		x2 = k2.x
		if (k2.notes)
			x2 += k2.notes[0].shhd
	} else {		/* (the slur starts on last note of the line) */
		for (k = k2.ts_next; k; k = k.ts_next)
//fixme: must check if the staff continues
			if (k.type == STAVES)
				break
		x2 = k ? k.x : realwidth
	}

	if (m1 >= 0) {
		y1 = 3 * (k1.notes[m1].pit - 18) + 5 * dir
	} else {
		y1 = dir > 0 ? k1.ymx + 2 : k1.ymn - 2
		if (k1.type == NOTE) {
			if (dir > 0) {
				if (k1.stem > 0) {
					x1 += 5
					if (k1.beam_end
					 && k1.nflags >= -1	/* if with a stem */
//fixme: check if at end of tuplet
					 && !k1.in_tuplet) {
//					  || k1.ys > y1 - 3)) {
						if (k1.nflags > 0) {
							x1 += 2;
							y1 = k1.ys - 3
						} else {
							y1 = k1.ys - 6
						}
// don't clash with decorations
//					} else {
//						y1 = k1.ys + 3
					}
//				} else {
//					y1 = k1.y + 8
				}
			} else {
				if (k1.stem < 0) {
					x1 -= 1
					if (k2.grace) {
						y1 = k1.y - 8
					} else if (k1.beam_end
						&& k1.nflags >= -1
						&& (!k1.in_tuplet
						 || k1.ys < y1 + 3)) {
						if (k1.nflags > 0) {
							x1 += 2;
							y1 = k1.ys + 3
						} else {
							y1 = k1.ys + 6
						}
//					} else {
//						y1 = k1.ys - 3
					}
//				} else {
//					y1 = k1.y - 8
				}
			}
		}
	}
	if (m2 >= 0) {
		y2 = 3 * (k2.notes[m2].pit - 18) + 5 * dir
	} else {
		y2 = dir > 0 ? k2.ymx + 2 : k2.ymn - 2
		if (k2.type == NOTE) {
			if (dir > 0) {
				if (k2.stem > 0) {
					x2 += 1
					if (k2.beam_st
					 && k2.nflags >= -1
					 && !k2.in_tuplet)
//						|| k2.ys > y2 - 3))
						y2 = k2.ys - 6
//					else
//						y2 = k2.ys + 3
//				} else {
//					y2 = k2.y + 8
				}
			} else {
				if (k2.stem < 0) {
					x2 -= 5
					if (k2.beam_st
					 && k2.nflags >= -1
					 && !k2.in_tuplet)
//						|| k2.ys < y2 + 3))
						y2 = k2.ys + 6
//					else
//						y2 = k2.ys - 3
//				} else {
//					y2 = k2.y - 8
				}
			}
		}
	}

	if (k1.type != NOTE) {
		y1 = y2 + 1.2 * dir;
		x1 = k1.x + k1.wr * .5
		if (x1 > x2 - 12)
			x1 = x2 - 12
	}

	if (k2.type != NOTE) {
		if (k1.type == NOTE)
			y2 = y1 + 1.2 * dir
		else
			y2 = y1
		if (k1 != k2)
			x2 = k2.x - k2.wl * .3
	}

	if (nn >= 3) {
		if (k1.next.type != BAR
		 && k1.next.x < x1 + 48) {
			if (dir > 0) {
				y = k1.next.ymx - 2
				if (y1 < y)
					y1 = y
			} else {
				y = k1.next.ymn + 2
				if (y1 > y)
					y1 = y
			}
		}
		if (k2.prev
		 && k2.prev.type != BAR
		 && k2.prev.x > x2 - 48) {
			if (dir > 0) {
				y = k2.prev.ymx - 2
				if (y2 < y)
					y2 = y
			} else {
				y = k2.prev.ymn + 2
				if (y2 > y)
					y2 = y
			}
		}
	}

	a = (y2 - y1) / (x2 - x1)		/* slur steepness */
	if (a > SLUR_SLOPE || a < -SLUR_SLOPE) {
		a = a > SLUR_SLOPE ? SLUR_SLOPE : -SLUR_SLOPE
		if (a * dir > 0)
			y1 = y2 - a * (x2 - x1)
		else
			y2 = y1 + a * (x2 - x1)
	}

	/* for big vertical jump, shift endpoints */
	y = y2 - y1
	if (y > 8)
		y = 8
	else if (y < -8)
		y = -8
	z = y
	if (z < 0)
		z = -z;
	dx = .5 * z;
	dy = .3 * y
	if (y * dir > 0) {
		x2 -= dx;
		y2 -= dy
	} else {
		x1 += dx;
		y1 += dy
	}

	/* special case for grace notes */
	if (k1.grace)
		x1 = k1.x - GSTEM_XOFF * .5
	if (k2.grace)
		x2 = k2.x + GSTEM_XOFF * 1.5;

	h = 0;
	a = (y2 - y1) / (x2 - x1)
	if (k1 != k2
	 && k1.v == k2.v) {
	    addy = y1 - a * x1
	    for (k = k1.next; k != k2 ; k = k.next) {
		if (k.st != upstaff)
			continue
		switch (k.type) {
		case NOTE:
		case REST:
			if (dir > 0) {
				y = 3 * (k.notes[k.nhd].pit - 18) + 6
				if (y < k.ymx)
					y = k.ymx;
				y -= a * k.x + addy
				if (y > h)
					h = y
			} else {
				y = 3 * (k.notes[0].pit - 18) - 6
				if (y > k.ymn)
					y = k.ymn;
				y -= a * k.x + addy
				if (y < h)
					h = y
			}
			break
		case GRACE:
			for (g = k.extra; g; g = g.next) {
				if (dir > 0) {
					y = 3 * (g.notes[g.nhd].pit - 18) + 6
					if (y < g.ymx)
						y = g.ymx;
					y -= a * g.x + addy
					if (y > h)
						h = y
				} else {
					y = 3 * (g.notes[0].pit - 18) - 6
					if (y > g.ymn)
						y = g.ymn;
					y -= a * g.x + addy
					if (y < h)
						h = y
				}
			}
			break
		}
	    }
	    y1 += .45 * h;
	    y2 += .45 * h;
	    h *= .65
	}

	if (nn > 3)
		height = (.08 * (x2 - x1) + 12) * dir
	else
		height = (.03 * (x2 - x1) + 8) * dir
	if (dir > 0) {
		if (height < 3 * h)
			height = 3 * h
		if (height > 40)
			height = 40
	} else {
		if (height > 3 * h)
			height = 3 * h
		if (height < -40)
			height = -40
	}

	y = y2 - y1
	if (y < 0)
		y = -y
	if (dir > 0) {
		if (height < .8 * y)
			height = .8 * y
	} else {
		if (height > -.8 * y)
			height = -.8 * y
	}
	height *= cfmt.slurheight;

//	anno_start(k1_o, 'slur');
	slur_out(x1, y1, x2, y2, dir, height, slur_type & SL_DOTTED);
//	anno_stop(k1_o, 'slur');

	/* have room for other symbols */
	dx = x2 - x1;
	a = (y2 - y1) / dx;
/*fixme: it seems to work with .4, but why?*/
	addy = y1 - a * x1 + .4 * height
	if (k1.v == k2.v)
	    for (k = k1; k != k2; k = k.next) {
		if (k.st != upstaff)
			continue
		y = a * k.x + addy
		if (k.ymx < y)
			k.ymx = y
		else if (k.ymn > y)
			k.ymn = y
		if (k.next == k2) {
			dx = x2
			if (k2.sl1)
				dx -= 5
		} else {
			dx = k.next.x
		}
		if (k != k1)
			x1 = k.x;
		dx -= x1;
		y_set(upstaff, dir > 0, x1, dx, y)
	}
	return (dir > 0 ? SL_ABOVE : SL_BELOW) | (slur_type & SL_DOTTED)
}

/* -- draw the slurs between 2 symbols --*/
function draw_slurs(first, last) {
	var	s1, k, gr1, gr2, i, m1, m2, slur_type, cont,
		s = first

	while (1) {
		if (!s || s == last) {
			if (!gr1
			 || !(s = gr1.next)
			 || s == last)
				break
			gr1 = null
		}
		if (s.type == GRACE) {
			gr1 = s;
			s = s.extra
			continue
		}
		if ((s.type != NOTE && s.type != REST
		  && s.type != SPACE)
		 || (!s.slur_start && !s.sl1)) {
			s = s.next
			continue
		}
		k = null;		/* find matching slur end */
		s1 = s.next
		var gr1_out = false
		while (1) {
			if (!s1) {
				if (gr2) {
					s1 = gr2.next;
					gr2 = null
					continue
				}
				if (!gr1 || gr1_out)
					break
				s1 = gr1.next;
				gr1_out = true
				continue
			}
			if (s1.type == GRACE) {
				gr2 = s1;
				s1 = s1.extra
				continue
			}
			if (s1.type == BAR
			 && (s1.bar_type[0] == ':'
			  || s1.bar_type == "|]"
			  || s1.bar_type == "[|"
			  || (s1.text && s1.text[0] != '1'))) {
				k = s1
				break
			}
			if (s1.type != NOTE && s1.type != REST
			 && s1.type != SPACE) {
				s1 = s1.next
				continue
			}
			if (s1.slur_end || s1.sl2) {
				k = s1
				break
			}
			if (s1.slur_start || s1.sl1) {
				if (gr2) {	/* if in grace note sequence */
					for (k = s1; k.next; k = k.next)
						;
					k.next = gr2.next
					if (gr2.next)
						gr2.next.prev = k;
//					gr2.slur_start = SL_AUTO
					k = null
				}
				draw_slurs(s1, last)
				if (gr2
				 && gr2.next) {
					gr2.next.prev.next = null;
					gr2.next.prev = gr2
				}
			}
			if (s1 == last)
				break
			s1 = s1.next
		}
		if (!s1) {
			k = next_scut(s)
		} else if (!k) {
			s = s1
			if (s == last)
				break
			continue
		}

		/* if slur in grace note sequence, change the linkages */
		if (gr1) {
			for (s1 = s; s1.next; s1 = s1.next)
				;
			s1.next = gr1.next
			if (gr1.next)
				gr1.next.prev = s1;
			gr1.slur_start = SL_AUTO
		}
		if (gr2) {
			gr2.prev.next = gr2.extra;
			gr2.extra.prev = gr2.prev;
			gr2.slur_start = SL_AUTO
		}
		if (s.slur_start) {
			slur_type = s.slur_start & 0x0f;
			s.slur_start >>= 4;
			m1 = -1
		} else {
			for (m1 = 0; m1 <= s.nhd; m1++)
				if (s.notes[m1].sl1)
					break
			slur_type = s.notes[m1].sl1 & 0x0f;
			s.notes[m1].sl1 >>= 4;
			s.sl1--
		}
		m2 = -1;
		cont = 0
		if ((k.type == NOTE || k.type == REST || k.type == SPACE) &&
		    (k.slur_end || k.sl2)) {
			if (k.slur_end) {
				k.slur_end--
			} else {
				for (m2 = 0; m2 <= k.nhd; m2++)
					if (k.notes[m2].sl2)
						break
				k.notes[m2].sl2--;
				k.sl2--
			}
		} else {
			if (k.type != BAR
			 || (k.bar_type[0] != ':'
			  && k.bar_type != "|]"
			  && k.bar_type != "[|"
			  && (!k.text || k.text[0] == '1')))
				cont = 1
		}
		slur_type = draw_slur(s, k, m1, m2, slur_type)
		if (cont) {
			if (!k.p_v.slur_start)
				k.p_v.slur_start = 0;
			k.p_v.slur_start <<= 4;
			k.p_v.slur_start += slur_type
		}

		/* if slur in grace note sequence, restore the linkages */
		if (gr1
		 && gr1.next) {
			gr1.next.prev.next = null;
			gr1.next.prev = gr1
		}
		if (gr2) {
			gr2.prev.next = gr2;
			gr2.extra.prev = null
		}

		if (s.slur_start || s.sl1)
			continue
		if (s == last)
			break
		s = s.next
	}
}

/* -- draw a tuplet -- */
/* (the staves are not yet defined) */
/* (delayed output) */
/* See http://moinejf.free.fr/abcm2ps-doc/tuplets.xhtml
 * for the value of 'tf' */
function draw_tuplet(s1,
			lvl) {	// nesting level
	var	s2, s3, g, upstaff, nb_only, some_slur,
		x1, x2, y1, y2, xm, ym, a, s0, yy, yx, dy, a, b, dir,
		p, q, r

	// check if some slurs and treat the nested tuplets
	upstaff = s1.st
	for (s2 = s1; s2; s2 = s2.next) {
		if (s2.type != NOTE && s2.type != REST) {
			if (s2.type == GRACE) {
				for (g = s2.extra; g; g = g.next) {
					if (g.slur_start || g.sl1)
						some_slur = true
				}
			}
			continue
		}
		if (s2.slur_start || s2.slur_end /* if slur start/end */
		 || s2.sl1 || s2.sl2)
			some_slur = true
		if (s2.st < upstaff)
			upstaff = s2.st
		if (lvl == 0) {
			if (s2.tp1)
				draw_tuplet(s2, 1)
			if (s2.te0)
				break
		} else if (s2.te1)
			break
	}

	if (!s2) {
		error(1, s1, "No end of tuplet in this music line")
		if (lvl == 0)
			s1.tp0 = 0
		else
			s1.tp1 = 0
		return
	}

	/* draw the slurs fully inside the tuplet */
	if (some_slur) {
		draw_slurs(s1, s2)

		// don't draw the tuplet when a slur starts or stops inside it
		if (s1.slur_start || s1.sl1)
			return
		for (s3 = s1.next; s3 != s2; s3 = s3.next) {
			if (s3.slur_start || s3.slur_end
			 || s3.sl1 || s3.sl2)
				return
		}

		if (s2.slur_end || s2.sl2)
			return
	}

	if (lvl == 0) {
		p = s1.tp0;
		s1.tp0 = 0;
		q = s1.tq0
	} else {
		p = s1.tp1;
		s1.tp1 = 0
		q = s1.tq1
	}

	if (s1.tf[0] == 1)			/* if 'when' == never */
		return

	dir = s1.tf[3]				/* 'where' (SL_xxx) */
	if (!dir)
		dir = s1.stem > 0 ? SL_ABOVE : SL_BELOW

	if (s1 == s2) {				/* tuplet with 1 note (!) */
		nb_only = true
	} else if (s1.tf[1] == 1) {			/* 'what' == slur */
		nb_only = true;
		draw_slur(s1, s2, -1, -1, dir)
	} else {

		/* search if a bracket is needed */
		if (s1.tf[0] == 2		/* if 'when' == always */
		 || s1.type != NOTE || s2.type != NOTE) {
			nb_only = false
		} else {
			nb_only = true
			for (s3 = s1; ; s3 = s3.next) {
				if (s3.type != NOTE
				 && s3.type != REST) {
					if (s3.type == GRACE
					 || s3.type == SPACE)
						continue
					nb_only = false
					break
				}
				if (s3 == s2)
					break
				if (s3.beam_end) {
					nb_only = false
					break
				}
			}
			if (nb_only
			 && !s1.beam_st
			 && !s1.beam_br1
			 && !s1.beam_br2) {
				for (s3 = s1.prev; s3; s3 = s3.prev) {
					if (s3.type == NOTE
					 || s3.type == REST) {
						if (s3.nflags >= s1.nflags)
							nb_only = false
						break
					}
				}
			}
			if (nb_only && !s2.beam_end) {
				for (s3 = s2.next; s3; s3 = s3.next) {
					if (s3.type == NOTE
					 || s3.type == REST) {
						if (!s3.beam_br1
						 && !s3.beam_br2
						 && s3.nflags >= s2.nflags)
							nb_only = false
						break
					}
				}
			}
		}
	}

	/* if number only, draw it */
	if (nb_only) {
		if (s1.tf[2] == 1)		/* if 'which' == none */
			return
		xm = (s2.x + s1.x) / 2
		if (s1 == s2)			/* tuplet with 1 note */
			a = 0
		else
			a = (s2.ys - s1.ys) / (s2.x - s1.x);
		b = s1.ys - a * s1.x;
		yy = a * xm + b
		if (dir == SL_ABOVE) {
			ym = y_get(upstaff, 1, xm - 4, 8)
			if (ym > yy)
				b += ym - yy;
			b += 2
		} else {
			ym = y_get(upstaff, 0, xm - 4, 8)
			if (ym < yy)
				b += ym - yy;
			b -= 10
		}
		for (s3 = s1; ; s3 = s3.next) {
			if (s3.x >= xm)
				break
		}
		if (s1.stem * s2.stem > 0) {
			if (s1.stem > 0)
				xm += 1.5
			else
				xm -= 1.5
		}
		ym = a * xm + b
		if (s1.tf[2] == 0)		/* if 'which' == number */
			out_bnum(xm, ym, p)
		else
			out_bnum(xm, ym, p + ':' +  q)
		if (dir == SL_ABOVE) {
			ym += 10
			if (s3.ymx < ym)
				s3.ymx = ym;
			y_set(upstaff, true, xm - 3, 6, ym)
		} else {
			if (s3.ymn > ym)
				s3.ymn = ym;
			y_set(upstaff, false, xm - 3, 6, ym)
		}
		return
	}

	if (s1.tf[1] != 0)				/* if 'what' != square */
		error(2, s1, "'what' value of %%tuplets not yet coded")

/*fixme: two staves not treated*/
/*fixme: to optimize*/
	dir = s1.tf[3]				// 'where'
	if (!dir)
		dir = s1.multi >= 0 ? SL_ABOVE : SL_BELOW
    if (dir == SL_ABOVE) {

	/* sole or upper voice: the bracket is above the staff */
	if (s1.st == s2.st) {
		y1 = y2 = staff_tb[upstaff].topbar + 4
	} else {
		y1 = s1.ymx;
		y2 = s2.ymx
	}

	x1 = s1.x - 4;
	if (s1.st == upstaff) {
		for (s3 = s1; !s3.dur; s3 = s3.next)
			;
		ym = y_get(upstaff, 1, s3.x - 4, 8)
		if (ym > y1)
			y1 = ym
		if (s1.stem > 0)
			x1 += 3
	}

	if (s2.st == upstaff) {
		for (s3 = s2; !s3.dur; s3 = s3.prev)
			;
		ym = y_get(upstaff, 1, s3.x - 4, 8)
		if (ym > y2)
			y2 = ym
	}

	/* end the backet according to the last note duration */
	if (s2.dur > s2.prev.dur) {
		if (s2.next)
			x2 = s2.next.x - s2.next.wl - 5
		else
			x2 = realwidth - 6
	} else {
		x2 = s2.x + 4;
		r = s2.stem >= 0 ? 0 : s2.nhd
		if (s2.notes[r].shhd > 0)
			x2 += s2.notes[r].shhd
		if (s2.st == upstaff
		 && s2.stem > 0)
			x2 += 3.5
	}

	xm = .5 * (x1 + x2);
	ym = .5 * (y1 + y2);

	a = (y2 - y1) / (x2 - x1);
	s0 = 3 * (s2.notes[s2.nhd].pit - s1.notes[s1.nhd].pit) / (x2 - x1)
	if (s0 > 0) {
		if (a < 0)
			a = 0
		else if (a > s0)
			a = s0
	} else {
		if (a > 0)
			a = 0
		else if (a < s0)
			a = s0
	}
	if (a * a < .1 * .1)
		a = 0

	/* shift up bracket if needed */
	dy = 0
	for (s3 = s1; ; s3 = s3.next) {
		if (!s3.dur			/* not a note or a rest */
		 || s3.st != upstaff) {
			if (s3 == s2)
				break
			continue
		}
		yy = ym + (s3.x - xm) * a;
		yx = y_get(upstaff, 1, s3.x - 4, 8) + 2
		if (yx - yy > dy)
			dy = yx - yy
		if (s3 == s2)
			break
	}

	ym += dy;
	y1 = ym + a * (x1 - xm);
	y2 = ym + a * (x2 - xm);

	/* shift the slurs / decorations */
	ym += 8
	for (s3 = s1; ; s3 = s3.next) {
		if (s3.st == upstaff) {
			yy = ym + (s3.x - xm) * a
			if (s3.ymx < yy)
				s3.ymx = yy
			if (s3 == s2)
				break
			y_set(upstaff, true, s3.x, s3.next.x - s3.x, yy)
		} else if (s3 == s2) {
			break
		}
	}

    } else {	/* lower voice of the staff: the bracket is below the staff */
/*fixme: think to all of that again..*/
	x1 = s1.x - 7
	if (s2.dur > s2.prev.dur) {
		if (s2.next)
			x2 = s2.next.x - s2.next.wl - 8
		else
			x2 = realwidth - 6
	} else {
		x2 = s2.x + 2
		if (s2.notes[s2.nhd].shhd > 0)
			x2 += s2.notes[s2.nhd].shhd
	}
	if (s1.stem >= 0) {
		x1 += 2;
		x2 += 2
	}

	if (s1.st == upstaff) {
		for (s3 = s1; !s3.dur; s3 = s3.next)
			;
		y1 = y_get(upstaff, 0, s3.x - 4, 8)
	} else {
		y1 = 0
	}
	if (s2.st == upstaff) {
		for (s3 = s2; !s3.dur; s3 = s3.prev)
			;
		y2 = y_get(upstaff, 0, s3.x - 4, 8)
	} else {
		y2 = 0
	}

	xm = .5 * (x1 + x2);
	ym = .5 * (y1 + y2);

	a = (y2 - y1) / (x2 - x1);
	s0 = 3 * (s2.notes[0].pit - s1.notes[0].pit) / (x2 - x1)
	if (s0 > 0) {
		if (a < 0)
			a = 0
		else if (a > s0)
			a = s0
	} else {
		if (a > 0)
			a = 0
		else if (a < s0)
			a = s0
	}
	if (a * a < .1 * .1)
		a = 0

	/* shift down the bracket if needed */
	dy = 0
	for (s3 = s1; ; s3 = s3.next) {
		if (!s3.dur			/* not a note nor a rest */
		 || s3.st != upstaff) {
			if (s3 == s2)
				break
			continue
		}
		yy = ym + (s3.x - xm) * a;
		yx = y_get(upstaff, 0, s3.x - 4, 8)
		if (yx - yy < dy)
			dy = yx - yy
		if (s3 == s2)
			break
	}

	ym += dy - 10;
	y1 = ym + a * (x1 - xm);
	y2 = ym + a * (x2 - xm);

	/* shift the slurs / decorations */
	ym -= 2
	for (s3 = s1; ; s3 = s3.next) {
		if (s3.st == upstaff) {
			if (s3 == s2)
				break
			yy = ym + (s3.x - xm) * a
			if (s3.ymn > yy)
				s3.ymn = yy;
			y_set(upstaff, false, s3.x, s3.next.x - s3.x, yy)
		}
		if (s3 == s2)
			break
	}
    } /* lower voice */

	if (s1.tf[2] == 1) {			/* if 'which' == none */
		out_tubr(x1, y1 + 4, x2 - x1, y2 - y1, dir == SL_ABOVE);
		return
	}
	out_tubrn(x1, y1, x2 - x1, y2 - y1, dir == SL_ABOVE,
		s1.tf[2] == 0 ? p.toString() : p + ':' +  q);

	yy = .5 * (y1 + y2)
	if (dir == SL_ABOVE)
		y_set(upstaff, true, xm - 3, 6, yy + 9)
	else
		y_set(upstaff, false, xm - 3, 6, yy)
}

/* -- draw the ties between two notes/chords -- */
function draw_note_ties(k1, k2, mhead1, mhead2, job) {
	var i, dir, m1, m2, p, p2, y, st, k, x1, x2, h, sh, time

	for (i = 0; i < mhead1.length; i++) {
		m1 = mhead1[i];
		p = k1.notes[m1].pit;
		m2 = mhead2[i];
		p2 = job != 2 ? k2.notes[m2].pit : p;
		dir = (k1.notes[m1].ti1 & 0x07) == SL_ABOVE ? 1 : -1;

		x1 = k1.x;
		sh = k1.notes[m1].shhd		/* head shift */
		if (dir > 0) {
			if (m1 < k1.nhd && p + 1 == k1.notes[m1 + 1].pit)
				if (k1.notes[m1 + 1].shhd > sh)
					sh = k1.notes[m1 + 1].shhd
		} else {
			if (m1 > 0 && p == k1.notes[m1 - 1].pit + 1)
				if (k1.notes[m1 - 1].shhd > sh)
					sh = k1.notes[m1 - 1].shhd
		}
		x1 += sh * .6;

		x2 = k2.x
		if (job != 2) {
			sh = k2.notes[m2].shhd
			if (dir > 0) {
				if (m2 < k2.nhd && p2 + 1 == k2.notes[m2 + 1].pit)
					if (k2.notes[m2 + 1].shhd < sh)
						sh = k2.notes[m2 + 1].shhd
			} else {
				if (m2 > 0 && p2 == k2.notes[m2 - 1].pit + 1)
					if (k2.notes[m2 - 1].shhd < sh)
						sh = k2.notes[m2 - 1].shhd
			}
			x2 += sh * .6
		}

		st = k1.st
		switch (job) {
		case 0:
			if (p != p2 && !(p & 1))
				p = p2
			break
		case 3:				/* clef or staff change */
			dir = -dir
			// fall thru
		case 1:				/* no starting note */
			x1 = k1.x
			if (x1 > x2 - 20)
				x1 = x2 - 20;
			p = p2;
			st = k2.st
			break
/*		case 2:				 * no ending note */
		default:
			if (k1 != k2) {
				x2 -= k2.wl
				if (k2.type == BAR)
					x2 += 5
			} else {
				time = k1.time + k1.dur
				for (k = k1.ts_next; k; k = k.ts_next)
//(fixme: must check if the staff continues??)
					if (k.time > time)
						break
				x2 = k ? k.x : realwidth
			}
			if (x2 < x1 + 16)
				x2 = x1 + 16
			break
		}
		if (x2 - x1 > 20) {
			x1 += 3.5;
			x2 -= 3.5
		} else {
			x1 += 1.5;
			x2 -= 1.5
		}

		y = 3 * (p - 18)

		h = (.04 * (x2 - x1) + 10) * dir;
//		anno_start(k1, 'slur');
		slur_out(x1, staff_tb[st].y + y,
			 x2, staff_tb[st].y + y,
			 dir, h, k1.notes[m1].ti1 & SL_DOTTED)
//		anno_stop(k1, 'slur')
	}
}

/* -- draw ties between neighboring notes/chords -- */
function draw_ties(k1, k2,
			job) {	// 0: normal
				// 1: no starting note
				// 2: no ending note
				// 3: no start for clef or staff change
	var	k3, i, j, m1, pit, tie2,
		mhead1 = [],
		mhead2 = [],
		mhead3 = [],
		nh1 = k1.nhd,
		time = k1.time + k1.dur

	/* half ties from last note in line or before new repeat */
	if (job == 2) {
		for (i = 0; i <= nh1; i++) {
			if (k1.notes[i].ti1)
				mhead3.push(i)
		}
		draw_note_ties(k1, k2 || k1, mhead3, mhead3, job)
		return
	}

	/* set up list of ties to draw */
	for (i = 0; i <= nh1; i++) {
		if (!k1.notes[i].ti1)
			continue
		tie2 = -1;
		pit = k1.notes[i].apit
		for (m1 = k2.nhd; m1 >= 0; m1--) {
			switch (k2.notes[m1].apit - pit) {
			case 1:			/* maybe ^c - _d */
			case -1:		/* _d - ^c */
				if (k1.notes[i].acc != k2.notes[m1].acc)
					tie2 = m1
			default:
				continue
			case 0:
				tie2 = m1
				break
			}
			break
		}
		if (tie2 >= 0) {		/* 1st or 2nd choice */
			mhead1.push(i);
			mhead2.push(tie2)
		} else {
			mhead3.push(i)		/* no match */
		}
	}

	/* draw the ties */
	draw_note_ties(k1, k2, mhead1, mhead2, job)

	/* if any bad tie, try an other voice of the same staff */
	if (!mhead3.length)
		return				/* no bad tie */

	k3 = k1.ts_next
	while (k3 && k3.time < time)
		k3 = k3.ts_next
	while (k3 && k3.time == time) {
		if (k3.type != NOTE
		 || k3.st != k1.st) {
			k3 = k3.ts_next
			continue
		}
		mhead1.length = 0;
		mhead2.length = 0
		for (i = mhead3.length; --i >= 0; ) {
			j = mhead3[i];
			pit = k1.notes[j].apit
			for (m1 = k3.nhd; m1 >= 0; m1--) {
				if (k3.notes[m1].apit == pit) {
					mhead1.push(j);
					mhead2.push(m1);
					mhead3[i] = mhead3.pop()
					break
				}
			}
		}
		if (mhead1.length > 0) {
			draw_note_ties(k1, k3,
					mhead1, mhead2,
					job == 1 ? 1 : 0)
			if (mhead3.length == 0)
				return
		}
		k3 = k3.ts_next
	}

	if (mhead3.length != 0)
		error(1, k1, "Bad tie")
}

/* -- try to get the symbol of a ending tie when combined voices -- */
function tie_comb(s) {
	var	s1, time, st;

	time = s.time + s.dur;
	st = s.st
	for (s1 = s.ts_next; s1; s1 = s1.ts_next) {
		if (s1.st != st)
			continue
		if (s1.time == time) {
			if (s1.type == NOTE)
				return s1
			continue
		}
		if (s1.time > time)
			return s		// bad tie
	}
	return //null				// no ending tie
}

/* -- draw all ties between neighboring notes -- */
function draw_all_ties(p_voice) {
	var s1, s2, s3, clef_chg, time, s_rtie, s_tie, x, dx

	function draw_ties_g(s1, s2, job) {
		var g

		if (s1.type == GRACE) {
			for (g = s1.extra; g; g = g.next) {
				if (g.ti1)
					draw_ties(g, s2, job)
			}
		} else {
			draw_ties(s1, s2, job)
		}
	} // draw_ties_g()

	for (s1 = p_voice.sym; s1; s1 = s1.next) {
		switch (s1.type) {
		case CLEF:
		case KEY:
		case METER:
			continue
		}
		break
	}
	s_rtie = p_voice.s_rtie			/* tie from 1st repeat bar */
	for (s2 = s1; s2; s2 = s2.next) {
		if (s2.dur
		 || s2.type == GRACE)
			break
		if (s2.type != BAR
		 || !s2.text)			// not a repeat bar
			continue
		if (s2.text[0] == '1')		/* 1st repeat bar */
			s_rtie = p_voice.s_tie
		else
			p_voice.s_tie = s_rtie
	}
	if (!s2)
		return
	if (p_voice.s_tie) {			/* tie from previous line */
		p_voice.s_tie.x = s1.x + s1.wr;
		s1 = p_voice.s_tie;
		p_voice.s_tie = null;
		s1.st = s2.st;
		s1.ts_next = s2.ts_next;	/* (for tie to other voice) */
		s1.time = s2.time - s1.dur;	/* (if after repeat sequence) */
		draw_ties(s1, s2, 1)		/* tie to 1st note */
	}

	/* search the start of ties */
//	clef_chg = false
	while (1) {
		for (s1 = s2; s1; s1 = s1.next) {
			if (s1.ti1)
				break
			if (!s_rtie)
				continue
			if (s1.type != BAR
			 || !s1.text)			// not a repeat bar
				continue
			if (s1.text[0] == '1') {	/* 1st repeat bar */
				s_rtie = null
				continue
			}
			if (s1.bar_type == '|')
				continue		// not a repeat
			for (s2 = s1.next; s2; s2 = s2.next)
				if (s2.type == NOTE)
					break
			if (!s2) {
				s1 = null
				break
			}
			s_tie = clone(s_rtie);
			s_tie.x = s1.x;
			s_tie.next = s2;
			s_tie.st = s2.st;
			s_tie.time = s2.time - s_tie.dur;
			draw_ties(s_tie, s2, 1)
		}
		if (!s1)
			break

		/* search the end of the tie
		 * and notice the clef changes (may occur in an other voice) */
		time = s1.time + s1.dur
		for (s2 = s1.next; s2; s2 = s2.next) {
			if (s2.dur)
				break
			if (s2.text) {			// repeat bar
				if (s2.text[0] != '1')
					break
				s_rtie = s1		/* 1st repeat bar */
			}
		}
		if (!s2) {
			for (s2 = s1.ts_next; s2; s2 = s2.ts_next) {
				if (s2.st != s1.st)
					continue
				if (s2.time < time)
					continue
				if (s2.time > time) {
					s2 = null
					break
				}
				if (s2.dur)
					break
			}
			if (!s2) {
				draw_ties_g(s1, null, 2);
				p_voice.s_tie = s1
				break
			}
		} else {
			if (s2.type != NOTE
			 && s2.type != BAR) {
				error(1, s1, "Bad tie")
				continue
			}
			if (s2.time != time) {
				s3 = tie_comb(s1)
				if (s3 == s1) {
					error(1, s1, "Bad tie")
					continue
				}
				s2 = s3
			}
		}
		for (s3 = s1.ts_next; s3; s3 = s3.ts_next) {
			if (s3.st != s1.st)
				continue
			if (s3.time > time)
				break
			if (s3.type == CLEF) {
				clef_chg = true
				continue
			}
		}

		/* ties with clef or staff change */
		if (clef_chg || s1.st != s2.st) {
			clef_chg = false;
			dx = (s2.x - s1.x) * .4;
			x = s2.x;
			s2.x -= dx
			if (s2.x > s1.x + 32.)
				s2.x = s1.x + 32.;
			draw_ties_g(s1, s2, 2);
			s2.x = x;
			x = s1.x;
			s1.x += dx
			if (s1.x < s2.x - 24.)
				s1.x = s2.x - 24.;
			draw_ties(s1, s2, 3);
			s1.x = x
			continue
		}
		draw_ties_g(s1, s2, s2.type == NOTE ? 0 : 2)
	}
	p_voice.s_rtie = s_rtie
}

/* -- draw all phrasing slurs for one staff -- */
/* (the staves are not yet defined) */
function draw_all_slurs(p_voice) {
	var	k, i, m2,
		s = p_voice.sym,
		slur_type = p_voice.slur_start,
		slur_st = 0

	if (!s)
		return

	/* the starting slur types are inverted */
	if (slur_type) {
		p_voice.slur_start = 0
		while (slur_type != 0) {
			slur_st <<= 4;
			slur_st |= (slur_type & 0x0f);
			slur_type >>= 4
		}
	}

	/* draw the slurs inside the music line */
	draw_slurs(s, undefined)

	/* do unbalanced slurs still left over */
	for ( ; s; s = s.next) {
		while (s.slur_end || s.sl2) {
			if (s.slur_end) {
				s.slur_end--;
				m2 = -1
			} else {
				for (m2 = 0; m2 <= s.nhd; m2++)
					if (s.notes[m2].sl2)
						break
				s.notes[m2].sl2--;
				s.sl2--
			}
			slur_type = slur_st & 0x0f;
			k = prev_scut(s);
			draw_slur(k, s, -1, m2, slur_type)
			if (k.type != BAR
			 || (k.bar_type[0] != ':'
			  && k.bar_type != "|]"
			  && k.bar_type != "[|"
			  && (!k.text || k.text[0] == '1')))
				slur_st >>= 4
		}
	}
	s = p_voice.sym
	while (slur_st != 0) {
		slur_type = slur_st & 0x0f;
		slur_st >>= 4;
		k = next_scut(s);
		draw_slur(s, k, -1, -1, slur_type)
		if (k.type != BAR
		 || (k.bar_type[0] != ':'
		  && k.bar_type != "|]"
		  && k.bar_type != "[|"
		  && (!k.text || k.text[0] == '1'))) {
			if (!p_voice.slur_start)
				p_voice.slur_start = 0;
			p_voice.slur_start <<= 4;
			p_voice.slur_start += slur_type
		}
	}
}

/* -- draw the symbols near the notes -- */
/* (the staves are not yet defined) */
/* order:
 * - scaled
 *   - beams
 *   - decorations near the notes
 *   - measure bar numbers
 *   - n-plets
 *   - decorations tied to the notes
 *   - slurs
 * - not scaled
 *   - guitar chords
 *   - staff decorations
 *   - lyrics
 *   - measure numbers
 * The buffer output is delayed until the definition of the staff system
 */
function draw_sym_near() {
	var p_voice, p_st, s, v, st, y, g, w, i, st, dx, top, bot, output_sav;

	output_sav = output;
	output = ""

	/* calculate the beams but don't draw them (the staves are not yet defined) */
	for (v = 0; v < voice_tb.length; v++) {
		var	bm = {},
			first_note = true;

		p_voice = voice_tb[v]
		for (s = p_voice.sym; s; s = s.next) {
			switch (s.type) {
			case GRACE:
				for (g = s.extra; g; g = g.next) {
					if (g.beam_st && !g.beam_end)
						calculate_beam(bm, g)
				}
				break
			case NOTE:
				if ((s.beam_st && !s.beam_end)
				 || (first_note && !s.beam_st)) {
					first_note = false;
					calculate_beam(bm, s)
				}
				break
			}
		}
	}

	/* initialize the min/max vertical offsets */
	for (st = 0; st <= nstaff; st++) {
		p_st = staff_tb[st]
		if (!p_st.top) {
			p_st.top = new Float32Array(YSTEP);
			p_st.bot = new Float32Array(YSTEP)
		}
		for (i = 0; i < YSTEP; i++) {
			p_st.top[i] = 0;
			p_st.bot[i] = 24
		}
//		p_st.top.fill(0.);
//		p_st.bot.fill(24.)
	}

	set_tie_room();
	draw_deco_near()

	/* set the min/max vertical offsets */
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.invis)
			continue
		switch (s.type) {
		case GRACE:
			for (g = s.extra; g; g = g.next) {
				y_set(s.st, true, g.x - 2, 4, g.ymx + 1);
				y_set(s.st, false, g.x - 2, 4, g.ymn - 1)
			}
			continue
		case MREST:
			y_set(s.st, true, s.x + 16, 32, s.ymx + 2)
			continue
		default:
			y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx + 2);
			y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn - 2)
			continue
		case NOTE:
			break
		}

		// (permit closer staves)
		if (s.stem > 0) {
			if (s.beam_st) {
				dx = 3;
				w = s.beam_end ? 4 : 10
			} else {
				dx = -8;
				w = s.beam_end ? 11 : 16
			}
			y_set(s.st, true, s.x + dx, w, s.ymx);
			y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn)
		} else {
			y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx);
			if (s.beam_st) {
				dx = -6;
				w = s.beam_end ? 4 : 10
			} else {
				dx = -8;
				w = s.beam_end ? 5 : 16
			}
			dx += s.notes[0].shhd;
			y_set(s.st, false, s.x + dx, w, s.ymn)
		}

		/* have room for the accidentals */
		if (s.notes[s.nhd].acc) {
			y = s.y + 8
			if (s.ymx < y)
				s.ymx = y;
			y_set(s.st, true, s.x, 0, y)
		}
		if (s.notes[0].acc) {
			y = s.y
			if (s.notes[0].acc == 1		// sharp
			 || s.notes[0].acc == 3)	// natural
				y -= 7
			else
				y -= 5
			if (s.ymn > y)
				s.ymn = y;
			y_set(s.st, false, s.x, 0, y)
		}
	}

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		s = p_voice.sym
		if (!s)
			continue
		set_color(s.color);
		st = p_voice.st;
//  if (st == undefined) {
//error(1, s, "BUG: no staff for voice " + p_voice.id)
//    continue
//  }
		set_dscale(st)

		/* draw the tuplets near the notes */
		for ( ; s; s = s.next) {
			if (s.tp0)
				draw_tuplet(s, 0)
		}
		draw_all_slurs(p_voice)

		/* draw the tuplets over the slurs */
		for (s = p_voice.sym; s; s = s.next) {
			if (s.tp0)
				draw_tuplet(s, 0)
		}
	}

	/* set the top and bottom out of the staves */
	for (st = 0; st <= nstaff; st++) {
		p_st = staff_tb[st];
		top = p_st.topbar + 2;
		bot = p_st.botbar - 2
/*fixme:should handle stafflines changes*/
		for (i = 0; i < YSTEP; i++) {
			if (top > p_st.top[i])
				p_st.top[i] = top
			if (bot < p_st.bot[i])
				p_st.bot[i] = bot
		}
	}

	set_color(undefined);
	draw_deco_note()
	draw_deco_staff();

	/* if any lyric, draw them now as unscaled */
	set_dscale(-1)
//	set_sscale(-1)
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.have_ly) {
			draw_all_lyrics()
			break
		}
	}

	if (cfmt.measurenb >= 0)
		draw_measnb();

	set_dscale(-1);
	output = output_sav
}

/* -- draw the name/subname of the voices -- */
function draw_vname(indent) {
	var	p_voice, n, st, v, a_p, p, y, name_type,
		staff_d = []

	for (st = cur_sy.nstaff; st >= 0; st--) {
		if (cur_sy.st_print[st])
			break
	}
	if (st < 0)
		return

	// check if full or sub names
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		st = cur_sy.voices[v].st
		if (!cur_sy.st_print[st])
			continue
		if (p_voice.new_name) {
			name_type = 2
			break
		}
		if (p_voice.snm)
			name_type = 1
	}
	if (!name_type)
		return
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		st = cur_sy.voices[v].st
		if (!cur_sy.st_print[st])
			continue
		if (p_voice.new_name)
			delete p_voice.new_name;
		p = name_type == 2 ? p_voice.nm : p_voice.snm
		if (!p)
			continue
		if (cur_sy.staves[st].flags & CLOSE_BRACE2) {
			while (!(cur_sy.staves[st].flags & OPEN_BRACE2))
				st--
		} else if (cur_sy.staves[st].flags & CLOSE_BRACE) {
			while (!(cur_sy.staves[st].flags & OPEN_BRACE))
				st--
		}
		if (!staff_d[st])
			staff_d[st] = p
		else
			staff_d[st] += "\\n" + p
	}
	if (staff_d.length == 0)
		return
	set_font("voice");
	indent = -indent * .5			/* center */
	for (st = 0; st < staff_d.length; st++) {
		if (!staff_d[st])
			continue
		a_p = staff_d[st].split('\\n');
		y = staff_tb[st].y
			+ staff_tb[st].topbar * .5
				* staff_tb[st].staffscale
			+ 9 * (a_p.length - 1)
			- gene.curfont.size * .3;
		n = st
		if (cur_sy.staves[st].flags & OPEN_BRACE2) {
			while (!(cur_sy.staves[n].flags & CLOSE_BRACE2))
				n++
		} else if (cur_sy.staves[st].flags & OPEN_BRACE) {
			while (!(cur_sy.staves[n].flags & CLOSE_BRACE))
				n++
		}
		if (n != st)
			y -= (staff_tb[st].y - staff_tb[n].y) * .5
		for (n = 0; n < a_p.length; n++) {
			p = a_p[n];
			xy_str(indent, y, p, "c");
			y -= 18
		}
	}
}

// -- set the y offset of the staves and return the height of the whole system --
function set_staff() {
	var	s, i, st, prev_staff, v,
		y, staffsep, dy, maxsep, mbot, val, p_voice, p_staff

	/* set the scale of the voices */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.scale != 1)
			p_voice.scale_str = 
				'transform="scale(' + p_voice.scale.toFixed(2) + ')"'
	}

	// search the top staff
	for (st = 0; st <= nstaff; st++) {
		if (gene.st_print[st])
			break
	}
	y = 0
	if (st > nstaff) {
		st--;			/* one staff, empty */
		p_staff = staff_tb[st]
	} else {
		p_staff = staff_tb[st]
		for (i = 0; i < YSTEP; i++) {
			val = p_staff.top[i]
			if (y < val)
				y = val
		}
	}

	/* draw the parts and tempo indications if any */
	y += draw_partempo(st, y)

	if (!gene.st_print[st])
		return y;

	/* set the vertical offset of the 1st staff */
	y *= p_staff.staffscale;
	staffsep = cfmt.staffsep * .5 +
			p_staff.topbar * p_staff.staffscale
	if (y < staffsep)
		y = staffsep
	if (y < p_staff.ann_top)	// absolute annotation
		y = p_staff.ann_top;
	p_staff.y = -y;

	/* set the offset of the other staves */
	prev_staff = st
	var sy_staff_prev = cur_sy.staves[prev_staff]
	for (st++; st <= nstaff; st++) {
		p_staff = staff_tb[st]
		if (!gene.st_print[st])
			continue
		staffsep = sy_staff_prev.sep || cfmt.sysstaffsep;
		maxsep = sy_staff_prev.maxsep || cfmt.maxsysstaffsep;

		dy = 0
		if (p_staff.staffscale == staff_tb[prev_staff].staffscale) {
			for (i = 0; i < YSTEP; i++) {
				val = p_staff.top[i] -
						staff_tb[prev_staff].bot[i]
				if (dy < val)
					dy = val
			}
			dy *= p_staff.staffscale
		} else {
			for (i = 0; i < YSTEP; i++) {
				val = p_staff.top[i] * p_staff.staffscale
				  - staff_tb[prev_staff].bot[i]
					* staff_tb[prev_staff].staffscale
				if (dy < val)
					dy = val
			}
		}
		staffsep += p_staff.topbar * p_staff.staffscale
		if (dy < staffsep)
			dy = staffsep;
		maxsep += p_staff.topbar * p_staff.staffscale
		if (dy > maxsep)
			dy = maxsep;
		y += dy;
		p_staff.y = -y;

		prev_staff = st;
		sy_staff_prev = cur_sy.staves[prev_staff]
	}
	mbot = 0
	for (i = 0; i < YSTEP; i++) {
		val = staff_tb[prev_staff].bot[i]
		if (mbot > val)
			mbot = val
	}
	if (mbot > p_staff.ann_bot) 	// absolute annotation
		mbot = p_staff.ann_bot;
	mbot *= staff_tb[prev_staff].staffscale

	/* output the staff offsets */
	for (st = 0; st <= nstaff; st++) {
		p_staff = staff_tb[st];
		dy = p_staff.y
		if (p_staff.staffscale != 1) {
			p_staff.scale_str =
				'transform="translate(0,' +
					(posy - dy).toFixed(2) + ') ' +
				'scale(' + p_staff.staffscale.toFixed(2) + ')"'
		}
	}

	if (mbot == 0) {
		for (st = nstaff; st >= 0; st--) {
			if (gene.st_print[st])
				break
		}
		if (st < 0)		/* no symbol in this system ! */
			return y
	}
	dy = -mbot;
	staffsep = cfmt.staffsep * .5
	if (dy < staffsep)
		dy = staffsep;
	maxsep = cfmt.maxstaffsep * .5
	if (dy > maxsep)
		dy = maxsep;

	// return the height of the whole staff system
	return y + dy
}

/* -- draw the staff systems and the measure bars -- */
function draw_systems(indent) {
	var	s, s2, st, x, x2, res,
		staves_bar, bar_force,
		xstaff = [],
		bar_bot = [],
		bar_height = []

	/* -- set the bottom and height of the measure bars -- */
	function bar_set() {
		var	st, staffscale, top, bot,
			dy = 0

		for (st = 0; st <= cur_sy.nstaff; st++) {
			if (xstaff[st] < 0) {
				bar_bot[st] = bar_height[st] = 0
				continue
			}
			staffscale = staff_tb[st].staffscale;
			top = staff_tb[st].topbar * staffscale;
			bot = staff_tb[st].botbar * staffscale
			if (dy == 0)
				dy = staff_tb[st].y + top;
			bar_bot[st] = staff_tb[st].y + bot;
			bar_height[st] = dy - bar_bot[st];
			dy = (cur_sy.staves[st].flags & STOP_BAR) ?
					0 : bar_bot[st]
		}
	} // bar_set()

	/* -- draw a staff -- */
	function draw_staff(st, x1, x2) {
		var	w, ws, i, dy, ty,
			y = 0,
			ln = "",
			stafflines = staff_tb[st].stafflines,
			l = stafflines.length

		if (!/[\[|]/.test(stafflines))
			return				// no line
		w = x2 - x1;
		set_sscale(st);
		ws = w / stv_g.scale

		// check if default staff
		if (cache && cache.st_l == stafflines && cache.st_ws == ws) {
			xygl(x1, staff_tb[st].y, 'stdef' + cfmt.fullsvg)
			return
		}
		for (i = 0; i < l; i++, y -= 6) {
			if (stafflines[i] == '.')
				continue
			dy = 0
			for (; i < l; i++, y -= 6, dy -= 6) {
				switch (stafflines[i]) {
				case '.':
				case '-':
					continue
				case ty:
					ln += 'm-' + ws.toFixed(2) +
						' ' + dy +
						'h' + ws.toFixed(2);
					dy = 0
					continue
				}
				if (ty != undefined)
					ln += '"/>\n';
				ty = stafflines[i]
				ln += '<path class="stroke"'
				if (ty == '[')
					ln += ' stroke-width="1.5"';
				ln += ' d="m0 ' + y + 'h' + ws.toFixed(2);
				dy = 0
			}
			ln += '"/>\n'
		}
		y = staff_tb[st].y
		if (!cache
		 && w == get_lwidth()) {
			cache = {
				st_l: stafflines,
				st_ws: ws
			}
			i = 'stdef' + cfmt.fullsvg;
			glyphs[i] = '<g id="' + i + '">\n' + ln + '</g>';
			xygl(x1, y, i)
			return
		}
		out_XYAB('<g transform="translate(X, Y)">\n' + ln + '</g>\n', x1, y)
	} // draw_staff()

	draw_vname(indent)

	/* draw the staff, skipping the staff breaks */
	for (st = 0; st <= nstaff; st++)
		xstaff[st] = !cur_sy.st_print[st] ? -1 : 0;
	bar_set();
	draw_lstaff(0)
	for (s = tsfirst; s; s = s.ts_next) {
		if (bar_force && s.time != bar_force) {
			bar_force = 0
			for (st = 0; st <= nstaff; st++) {
				if (!cur_sy.st_print[st])
					xstaff[st] = -1
			}
			bar_set()
		}
		switch (s.type) {
		case STAVES:
			staves_bar = 0
			for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
				if (s2.time != s.time)
					break
				switch (s2.type) {
				case BAR:
				case CLEF:
				case KEY:
				case METER:
					staves_bar = s2.x
					continue
				}
				break
			}
			if (!s2)
				staves_bar = realwidth;
			cur_sy = s.sy
			for (st = 0; st <= nstaff; st++) {
				x = xstaff[st]
				if (x < 0) {		// no staff yet
					if (cur_sy.st_print[st])
						xstaff[st] = s.ts_next.type == BAR ?
							s.x : (s.x - s.wl - 2)
					continue
				}
				if (cur_sy.st_print[st]) // if not staff stop
					continue
				if (staves_bar) {
					x2 = staves_bar;
					bar_force = s.time
				} else {
					x2 = s.x - s.wl - 2;
					xstaff[st] = -1
				}
				draw_staff(st, x, x2)
			}
			bar_set()
			continue
		case BAR:
			st = s.st
			if (s.second || s.invis)
				break

			// if the bar is not in the current staff system
			// it may be in the next one
			if (xstaff[st] < 0) {
				for (s2 = s.ts_next;
				     s2 && s2.time == s.time;
				     s2 = s2.ts_next) {
					if (s2.type == STAVES)
						break
				}
				if (!s2 || s2.type != STAVES)
					break
				xstaff[st] = s.x;
				bar_set()
			}

			draw_bar(s, bar_bot[st], bar_height[st]);
			break
		case STBRK:
			if (cur_sy.voices[s.v].range == 0) {
				if (s.xmx > 14) {

					/* draw the left system if stbrk in all voices */
					var nv = 0
					for (var i = 0; i < voice_tb.length; i++) {
						if (cur_sy.voices[i].range > 0)
							nv++
					}
					for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
						if (s2.type != STBRK)
							break
						nv--
					}
					if (nv == 0)
						draw_lstaff(s.x)
				}
			}
			s2 = s.prev
			if (!s2)
				break
			x2 = s2.x
			if (s2.type != BAR)
				x2 += s2.wr;
			st = s.st;
			x = xstaff[st]
			if (x >= 0) {
				if (x >= x2)
					continue
				draw_staff(st, x, x2)
			}
			xstaff[st] = s.x
			break
//		default:
//fixme:does not work for "%%staves K: M: $" */
//removed for K:/M: in empty staves
//			if (!cur_sy.st_print[st])
//				s.invis = true
//			break
		}
	}

	// draw the end of the staves
	for (st = 0; st <= nstaff; st++) {
		if (bar_force && !cur_sy.st_print[st])
			continue
		x = xstaff[st]
		if (x < 0 || x >= realwidth)
			continue
		draw_staff(st, x, realwidth)
	}
//	set_sscale(-1)
}

/* -- draw remaining symbols when the staves are defined -- */
function draw_symbols(p_voice) {
	var	bm = {},
		s, g, x, y, st;

//	bm.s2 = undefined
	for (s = p_voice.sym; s; s = s.next) {
		if (s.invis) {
			switch (s.type) {
			case KEY:
				p_voice.key = s
			default:
				continue
			case NOTE:	// (beams may start on invisible notes)
				break
			}
		}
		x = s.x;
		set_color(s.color)
		switch (s.type) {
		case NOTE:
//--fixme: recall set_scale if different staff
			set_scale(s)
			if (s.beam_st && !s.beam_end) {
				if (calculate_beam(bm, s))
					draw_beams(bm)
			}
			if (!s.invis) {
				anno_start(s);
				draw_note(s, !bm.s2);
				anno_stop(s)
			}
			if (s == bm.s2)
				bm.s2 = null
			break
		case REST:
			draw_rest(s);
			break
		case BAR:
			break			/* drawn in draw_systems */
		case CLEF:
			st = s.st
			if (s.time > staff_tb[st].clef.time)
				staff_tb[st].clef = s
			if (s.second)
/*			 || p_voice.st != st)	*/
				break		/* only one clef per staff */
			if (!staff_tb[s.st].topbar)
				break
			set_color(undefined);
			set_sscale(st);
			anno_start(s);
			y = staff_tb[st].y
			if (s.clef_name)
				xygl(x, y + s.y, s.clef_name)
			else if (!s.clef_small)
				xygl(x, y + s.y, s.clef_type + "clef")
			else
				xygl(x, y + s.y, "s" + s.clef_type + "clef")
			if (s.clef_octave) {
/*fixme:break the compatibility and avoid strange numbers*/
				if (s.clef_octave > 0) {
					y += s.ymx - 10
					if (s.clef_small)
						y -= 1
				} else {
					y += s.ymn + 2
					if (s.clef_small)
						y += 1
				}
				xygl(x - 2, y, "oct")
			}
			anno_stop(s)
			break
		case METER:
			p_voice.meter = s
			if (s.second
			 || !staff_tb[s.st].topbar)
				break
			if (cfmt.alignbars && s.st != 0)
				break
			set_color(undefined);
			set_sscale(s.st);
			anno_start(s);
			draw_meter(x, s);
			anno_stop(s)
			break
		case KEY:
			p_voice.key = s
			if (s.second
			 || !staff_tb[s.st].topbar)
				break
			set_color(undefined);
			set_sscale(s.st);
			anno_start(s);
			draw_keysig(p_voice, x, s);
			anno_stop(s)
			break
		case MREST:
			set_scale(s);
			x += 32;
			anno_start(s);
			xygl(x, staff_tb[s.st].y + 12, "mrest");
			out_XYAB('<text style="font-family:serif; font-weight:bold; font-size: 15px"\n\
	x ="X" y="Y" text-anchor="middle">A</text>\n',
				x, staff_tb[s.st].y + 28, s.nmes);
			anno_stop(s)
			break
		case GRACE:
			set_scale(s);
			draw_gracenotes(s)
			break
		case SPACE:
		case STBRK:
			break			/* nothing */
		case CUSTOS:
			set_scale(s);
			draw_note(s, 0)
			break
		case BLOCK:			// no width
		case PART:
		case REMARK:
		case STAVES:
		case TEMPO:
			break
		default:
			error(2, s, "draw_symbols - Cannot draw symbol " + s.type)
			break
		}
	}
	set_scale(p_voice.sym);
	draw_all_ties(p_voice);
// no need to reset the scale as in abcm2ps
	set_color(undefined)
}

/* -- draw all symbols -- */
function draw_all_sym() {
	var	p_voice, v,
		n = voice_tb.length

	for (v = 0; v < n; v++) {
		p_voice = voice_tb[v]
		if (p_voice.sym
		 && p_voice.sym.x != undefined)
			draw_symbols(p_voice)
	}

	draw_all_deco();
	set_sscale(-1)				/* restore the scale */
}

/* -- set the tie directions for one voice -- */
function set_tie_dir(sym) {
	var s, i, ntie, dir, sec, pit, ti

	for (s = sym; s; s = s.next) {
		if (!s.ti1)
			continue

		/* if other voice, set the ties in opposite direction */
		if (s.multi != 0) {
			dir = s.multi > 0 ? SL_ABOVE : SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ti = s.notes[i].ti1;
				if (!((ti & 0x07) == SL_AUTO))
					continue
				s.notes[i].ti1 = (ti & SL_DOTTED) | dir
			}
			continue
		}

		/* if one note, set the direction according to the stem */
		sec = ntie = 0;
		pit = 128
		for (i = 0; i <= s.nhd; i++) {
			if (s.notes[i].ti1) {
				ntie++
				if (pit < 128
				 && s.notes[i].pit <= pit + 1)
					sec++;
				pit = s.notes[i].pit
			}
		}
		if (ntie <= 1) {
			dir = s.stem < 0 ? SL_ABOVE : SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ti = s.notes[i].ti1
				if (ti) {
					if ((ti & 0x07) == SL_AUTO)
						s.notes[i].ti1 =
							(ti & SL_DOTTED) | dir
					break
				}
			}
			continue
		}
		if (sec == 0) {
			if (ntie & 1) {
/* in chords with an odd number of notes, the outer noteheads are paired off
 * center notes are tied according to their position in relation to the
 * center line */
				ntie = (ntie - 1) / 2;
				dir = SL_BELOW
				for (i = 0; i <= s.nhd; i++) {
					ti = s.notes[i].ti1
					if (ti == 0)
						continue
					if (ntie == 0) {	/* central tie */
						if (s.notes[i].pit >= 22)
							dir = SL_ABOVE
					}
					if ((ti & 0x07) == SL_AUTO)
						s.notes[i].ti1 =
							(ti & SL_DOTTED) | dir
					if (ntie-- == 0)
						dir = SL_ABOVE
				}
				continue
			}
/* even number of notes, ties divided in opposite directions */
			ntie /= 2;
			dir = SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ti = s.notes[i].ti1
				if (ti == 0)
					continue
				if ((ti & 0x07) == SL_AUTO)
					s.notes[i].ti1 =
						(ti & SL_DOTTED) | dir
				if (--ntie == 0)
					dir = SL_ABOVE
			}
			continue
		}
/*fixme: treat more than one second */
/*		if (nsec == 1) {	*/
/* When a chord contains the interval of a second, tie those two notes in
 * opposition; then fill in the remaining notes of the chord accordingly */
			pit = 128
			for (i = 0; i <= s.nhd; i++) {
				if (s.notes[i].ti1) {
					if (pit < 128
					 && s.notes[i].pit <= pit + 1) {
						ntie = i
						break
					}
					pit = s.notes[i].pit
				}
			}
			dir = SL_BELOW
			for (i = 0; i <= s.nhd; i++) {
				ti = s.notes[i].ti1
				if (ti == 0)
					continue
				if (ntie == i)
					dir = SL_ABOVE
				if ((ti & 0x07) == SL_AUTO)
					s.notes[i].ti1 = (ti & SL_DOTTED) | dir
			}
/*fixme..
			continue
		}
..*/
/* if a chord contains more than one pair of seconds, the pair farthest
 * from the center line receives the ties drawn in opposition */
	}
}

/* -- have room for the ties out of the staves -- */
function set_tie_room() {
	var p_voice, s, s2, v, dx, y, dy

	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v];
		s = p_voice.sym
		if (!s)
			continue
		s = s.next
		if (!s)
			continue
		set_tie_dir(s)
		for ( ; s; s = s.next) {
			if (!s.ti1)
				continue
			if (s.notes[0].pit < 20
			 && (s.notes[0].ti1 & 0x07) == SL_BELOW)
				;
			else if (s.notes[s.nhd].pit > 24
			      && (s.notes[s.nhd].ti1 & 0x07) == SL_ABOVE)
				;
			else
				continue
			s2 = s.next
			while (s2 && s2.type != NOTE)
				s2 = s2.next
			if (s2) {
				if (s2.st != s.st)
					continue
				dx = s2.x - s.x - 10
			} else {
				dx = realwidth - s.x - 10
			}
			if (dx < 100)
				dy = 9
			else if (dx < 300)
				dy = 12
			else
				dy = 16
			if (s.notes[s.nhd].pit > 24) {
				y = 3 * (s.notes[s.nhd].pit - 18) + dy
				if (s.ymx < y)
					s.ymx = y
				if (s2 && s2.ymx < y)
					s2.ymx = y;
				y_set(s.st, true, s.x + 5, dx, y)
			}
			if (s.notes[0].pit < 20) {
				y = 3 * (s.notes[0].pit - 18) - dy
				if (s.ymn > y)
					s.ymn = y
				if (s2 && s2.ymn > y)
					s2.ymn = y;
				y_set(s.st, false, s.x + 5, dx, y)
			}
		}
	}
}
