// abc2svg - lyrics.js - lyrics
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

// parse a symbol line (s:)
function get_sym(p, cont) {
	var s, c, i, j, d

	if (curvoice.ignore)
		return

	// get the starting symbol of the lyrics
	if (cont) {					// +:
		s = curvoice.sym_cont
		if (!s) {
			syntax(1, "+: symbol line without music")
			return
		}
	} else {
		if (curvoice.sym_restart) {		// new music
			curvoice.sym_start = s = curvoice.sym_restart;
			curvoice.sym_restart = null
		} else {
			s = curvoice.sym_start
		}
		if (!s)
			s = curvoice.sym
		if (!s) {
			syntax(1, "s: without music")
			return
		}
	}

	/* scan the symbol line */
	i = 0
	while (1) {
		while (p[i] == ' ' || p[i] == '\t')
			i++;
		c = p[i]
		if (!c)
			break
		switch (c) {
		case '|':
			while (s && s.type != BAR)
				s = s.next
			if (!s) {
				syntax(1, "Not enough measure bars for symbol line")
				return
			}
			s = s.next;
			i++
			continue
		case '!':
		case '"':
			j = ++i
			i = p.indexOf(c, j)
			if (i < 0) {
				syntax(1, c == '!' ?
					"No end of decoration" :
					"No end of guitar chord");
				i = p.length
				continue
			}
			d = p.slice(j - 1, i + 1)
			break
		case '*':
			break
		default:
			d = c.charCodeAt(0)
			if (d < 128) {
				d = char_tb[d]
				if (d.length > 1
				 && (d[0] == '!' || d[0] == '"')) {
					c = d[0]
					break
				}
			}
			syntax(1, errs.bad_char, c)
			break
		}

		/* store the element in the next note */
		while (s && (s.type != NOTE || s.grace))
			s = s.next
		if (!s) {
			syntax(1, "Too many elements in symbol line")
			return
		}
		switch (c) {
		default:
//		case '*':
			break
		case '!':
			deco_cnv([d.slice(1, -1)], s, s.prev)
			break
		case '"':
			a_gch = s.a_gch;
			parse_gchord(d)
			if (a_gch)
				gch_build(s)
			break
		}
		s = s.next;
		i++
	}
	curvoice.lyric_cont = s
}

/* -- parse a lyric (vocal) line (w:) -- */
function get_lyrics(text, cont) {
	var s, word, p, i, j, ly

	if (curvoice.ignore)
		return
	if (curvoice.pos.voc != SL_HIDDEN)
		curvoice.have_ly = true

	// get the starting symbol of the lyrics
	if (cont) {					// +:
		s = curvoice.lyric_cont
		if (!s) {
			syntax(1, "+: lyric without music")
			return
		}
	} else {
		set_font("vocal")
		if (curvoice.lyric_restart) {		// new music
			curvoice.lyric_start = s = curvoice.lyric_restart;
			curvoice.lyric_restart = null;
			curvoice.lyric_line = 0
		} else {
			curvoice.lyric_line++;
			s = curvoice.lyric_start
		}
		if (!s)
			s = curvoice.sym
		if (!s) {
			syntax(1, "w: without music")
			return
		}
	}

	/* scan the lyric line */
	p = text;
	i = 0
	while (1) {
		while (p[i] == ' ' || p[i] == '\t')
			i++
		if (!p[i])
			break
		j = parse.istart + i + 2	// start index
		switch (p[i]) { 
		case '|':
			while (s && s.type != BAR)
				s = s.next
			if (!s) {
				syntax(1, "Not enough measure bars for lyric line")
				return
			}
			s = s.next;
			i++
			continue
		case '-':
			word = "-\n"
			break
		case '_':
			word = "_\n"
			break
		case '*':
			word = ""
			break
		default:
			if (p[i] == '\\'
			 && i == p.length - 1) {
				curvoice.lyric_cont = s
				return
			}
			word = "";
			while (1) {
				if (!p[i])
					break
				switch (p[i]) {
				case '_':
				case '*':
				case '|':
					i--
				case ' ':
				case '\t':
					break
				case '~':
					word += ' ';
					i++
					continue
				case '-':
					word += "\n"
					break
				case '\\':
					word += p[++i];
					i++
					continue
				default:
					word += p[i++]
					continue
				}
				break
			}
			break
		}

		/* store the word in the next note */
		while (s && (s.type != NOTE || s.grace))
			s = s.next
		if (!s) {
			syntax(1, "Too many words in lyric line")
			return
		}
		if (word
		 && s.pos.voc != SL_HIDDEN) {
			if (word.match(/^\$\d/)) {
				if (word[1] == '0')
					set_font("vocal")
				else
					set_font("u" + word[1]);
				word = word.slice(2)
			}
			ly = {
				t: word,
				font: gene.curfont,
				w: strwh(word)[0],
				istart: j,
				iend: j + word.length
			}
			if (!s.a_ly)
				s.a_ly = []
			s.a_ly[curvoice.lyric_line] = ly
		}
		s = s.next;
		i++
	}
	curvoice.lyric_cont = s
}

// -- set the width needed by the lyrics --
// (called once per tune)
function ly_width(s, wlw) {
	var	ly, sz, swfac, align, xx, w, i, j, k, shift, p,
		a_ly = s.a_ly;

	align = 0
	for (i = 0; i < a_ly.length; i++) {
		ly = a_ly[i]
		if (!ly)
			continue
		p = ly.t;
		if (p == "-\n" || p == "_\n") {
			ly.shift = 0
			continue
		}
		w = ly.w;
		swfac = ly.font.swfac;
		xx = w + 2 * cwid(' ') * swfac
		if (s.type == GRACE) {			// %%graceword
			shift = s.wl
		} else if ((p[0] >= '0' && p[0] <= '9' && p.length > 2)
		 || p[1] == ':'
		 || p[0] == '(' || p[0] == ')') {
			if (p[0] == '(') {
				sz = cwid('(') * swfac
			} else {
				j = p.indexOf(' ');
				set_font(ly.font)
				if (j > 0)
					sz = strwh(p.slice(0, j))[0]
				else
					sz = w
			}
			shift = (w - sz + 2 * cwid(' ') * swfac) * .4
			if (shift > 20)
				shift = 20;
			shift += sz
			if (ly.t[0] >= '0' && ly.t[0] <= '9') {
				if (shift > align)
					align = shift
			}
		} else {
			shift = xx * .4
			if (shift > 20)
				shift = 20
		}
		ly.shift = shift
		if (wlw < shift)
			wlw = shift;
//		if (p[p.length - 1] == "\n")		// if "xx-"
//			xx -= cwid(' ') * swfac
		xx -= shift;
		shift = 2 * cwid(' ') * swfac
		for (k = s.next; k; k = k.next) {
			switch (k.type) {
			case NOTE:
			case REST:
				if (!k.a_ly || !k.a_ly[i]
				 || k.a_ly[i].w == 0)
					xx -= 9
				else if (k.a_ly[i].t == "-\n"
				      || k.a_ly[i].t == "_\n")
					xx -= shift
				else
					break
				if (xx <= 0)
					break
				continue
			case CLEF:
			case METER:
			case KEY:
				xx -= 10
				continue
			default:
				xx -= 5
				break
			}
			break
		}
		if (xx > s.wr)
			s.wr = xx
	}
	if (align > 0) {
		for (i = 0; i < a_ly.length; i++) {
			ly = a_ly[i]
			if (ly && ly.t[0] >= '0' && ly.t[0] <= '9')
				ly.shift = align
		}
	}
	return wlw
}

/* -- draw the lyrics under (or above) notes -- */
/* (the staves are not yet defined) */
/* !! this routine is tied to ly_width() !! */
function draw_lyric_line(p_voice, j, y) {
	var	p, lastx, w, s, s2, ly, lyl,
		hyflag, lflag, x0, font, shift

	if (p_voice.hy_st & (1 << j)) {
		hyflag = true;
		p_voice.hy_st &= ~(1 << j)
	}
	for (s = p_voice.sym; /*s*/; s = s.next)
		if (s.type != CLEF
		 && s.type != KEY && s.type != METER)
			break
	lastx = s.prev ? s.prev.x : tsfirst.x;
	x0 = 0
	for ( ; s; s = s.next) {
		if (s.a_ly)
			ly = s.a_ly[j]
		else
			ly = null
		if (!ly) {
			switch (s.type) {
			case REST:
			case MREST:
				if (lflag) {
					out_wln(lastx + 3, y, x0 - lastx);
					lflag = false;
					lastx = s.x + s.wr
				}
			}
			continue
		}
		if (ly.font != gene.curfont)		/* font change */
			gene.curfont = font = ly.font;
		p = ly.t;
		w = ly.w;
		shift = ly.shift
		if (hyflag) {
			if (p == "_\n") {		/* '_' */
				p = "-\n"
			} else if (p != "-\n") {	/* not '-' */
				out_hyph(lastx, y, s.x - shift - lastx);
				hyflag = false;
				lastx = s.x + s.wr
			}
		}
		if (lflag
		 && p != "_\n") {		/* not '_' */
			out_wln(lastx + 3, y, x0 - lastx + 3);
			lflag = false;
			lastx = s.x + s.wr
		}
		if (p == "-\n"			/* '-' */
		 || p == "_\n") {		/* '_' */
			if (x0 == 0 && lastx > s.x - 18)
				lastx = s.x - 18
			if (p[0] == '-')
				hyflag = true
			else
				lflag = true;
			x0 = s.x - shift
			continue
		}
		x0 = s.x - shift;
		if (p.slice(-1) == '\n') {
			p = p.slice(0, -1);	/* '-' at end */
			hyflag = true
		}
		if (user.anno_start || user.anno_stop) {
			s2 = {
				st: s.st,
				istart: ly.istart,
				iend: ly.iend,
				x: x0,
				y: y,
				ymn: y,
				ymx: y + gene.curfont.size,
				wl: 0,
				wr: w
			}
			anno_start(s2, 'lyrics')
		}
		xy_str(x0, y, p);
		anno_stop(s2, 'lyrics')
		lastx = x0 + w
	}
	if (hyflag) {
		hyflag = false;
		x0 = realwidth - 10
		if (x0 < lastx + 10)
			x0 = lastx + 10;
		out_hyph(lastx, y, x0 - lastx)
		if (cfmt.hyphencont)
			p_voice.hy_st |= (1 << j)
	}

	/* see if any underscore in the next line */
	for (p_voice.s_next ; s; s = s.next) {
		if (s.type == NOTE) {
			if (!s.a_ly)
				break
			ly = s.a_ly[j]
			if (ly && ly.t == "_\n") {
				lflag = true;
				x0 = realwidth - 15
				if (x0 < lastx + 12)
					x0 = lastx + 12
			}
			break
		}
	}
	if (lflag) {
		out_wln(lastx + 3, y, x0 - lastx + 3);
		lflag = false
	}
}

function draw_lyrics(p_voice, nly, a_h, y,
				incr) {	/* 1: below, -1: above */
	var	j, top,
		sc = staff_tb[p_voice.st].staffscale;

	set_font("vocal")
	if (incr > 0) {				/* under the staff */
		if (y > -cfmt.vocalspace)
			y = -cfmt.vocalspace;
		y *= sc
		for (j = 0; j < nly; j++) {
			y -= a_h[j] * 1.1;
			draw_lyric_line(p_voice, j, y)
		}
		return (y - a_h[j - 1] / 6) / sc
	}

	/* above the staff */
	top = staff_tb[p_voice.st].topbar + cfmt.vocalspace
	if (y < top)
		y = top;
	y *= sc
	for (j = nly; --j >= 0;) {
		draw_lyric_line(p_voice, j, y);
		y += a_h[j] * 1.1
	}
	return y / sc
}

// -- draw all the lyrics --
/* (the staves are not yet defined) */
function draw_all_lyrics() {
	var	p_voice, s, v, nly, i, x, y, w, a_ly, ly,
		lyst_tb = new Array(nstaff),
		nv = voice_tb.length,
		h_tb = new Array(nv),
		nly_tb = new Array(nv),
		above_tb = new Array(nv),
		rv_tb = new Array(nv),
		top = 0,
		bot = 0,
		st = -1

	/* compute the number of lyrics per voice - staff
	 * and their y offset on the staff */
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		if (p_voice.st != st) {
			top = 0;
			bot = 0;
			st = p_voice.st
		}
		nly = 0
		if (p_voice.have_ly) {
			if (!h_tb[v])
				h_tb[v] = []
			for (s = p_voice.sym; s; s = s.next) {
				a_ly = s.a_ly
				if (!a_ly)
					continue
/*fixme:should get the real width*/
				x = s.x;
				w = 10
				for (i = 0; i < a_ly.length; i++) {
					ly = a_ly[i]
					if (ly && ly.w != 0) {
						x -= ly.shift;
						w = ly.w
						break
					}
				}
				y = y_get(p_voice.st, 1, x, w)
				if (top < y)
					top = y;
				y = y_get(p_voice.st, 0, x, w)
				if (bot > y)
					bot = y
				while (nly < a_ly.length)
					h_tb[v][nly++] = 0
				for (i = 0; i < a_ly.length; i++) {
					ly = a_ly[i]
					if (!ly)
						continue
					if (!h_tb[v][i]
					 || ly.font.size > h_tb[v][i])
						h_tb[v][i] = ly.font.size
				}
			}
		} else {
			y = y_get(p_voice.st, 1, 0, realwidth)
			if (top < y)
				top = y;
			y = y_get(p_voice.st, 0, 0, realwidth)
			if (bot > y)
				bot = y
		}
		if (!lyst_tb[st])
			lyst_tb[st] = {}
		lyst_tb[st].top = top;
		lyst_tb[st].bot = bot;
		nly_tb[v] = nly
		if (nly == 0)
			continue
		if (p_voice.pos.voc)
			above_tb[v] = p_voice.pos.voc == SL_ABOVE
		else if (voice_tb[v + 1]
/*fixme:%%staves:KO - find an other way..*/
		      && voice_tb[v + 1].st == st
		      && voice_tb[v + 1].have_ly)
			above_tb[v] = true
		else
			above_tb[v] = false
		if (above_tb[v])
			lyst_tb[st].a = true
		else
			lyst_tb[st].b = true
	}

	/* draw the lyrics under the staves */
	i = 0
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		if (!p_voice.have_ly)
			continue
		if (above_tb[v]) {
			rv_tb[i++] = v
			continue
		}
		st = p_voice.st;
// don't scale the lyrics
		set_dscale(st, true)
		if (nly_tb[v] > 0)
			lyst_tb[st].bot = draw_lyrics(p_voice, nly_tb[v],
							h_tb[v],
							lyst_tb[st].bot, 1)
	}

	/* draw the lyrics above the staff */
	while (--i >= 0) {
		v = rv_tb[i];
		p_voice = voice_tb[v];
		st = p_voice.st;
		set_dscale(st, true);
		lyst_tb[st].top = draw_lyrics(p_voice, nly_tb[v],
						h_tb[v],
						lyst_tb[st].top, -1)
	}

	/* set the max y offsets of all symbols */
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		st = p_voice.st;
		if (lyst_tb[st].a) {
			top = lyst_tb[st].top + 2
			for (s = p_voice.sym.next; s; s = s.next) {
/*fixme: may have lyrics crossing a next symbol*/
				if (s.a_ly) {
/*fixme:should set the real width*/
					y_set(st, 1, s.x - 2, 10, top)
				}
			}
		}
		if (lyst_tb[st].b) {
			bot = lyst_tb[st].bot - 2
			if (nly_tb[p_voice.v] > 0) {
				for (s = p_voice.sym.next; s; s = s.next) {
					if (s.a_ly) {
/*fixme:should set the real width*/
						y_set(st, 0, s.x - 2, 10, bot)
					}
				}
			} else {
				y_set(st, 0, 0, realwidth, bot)
			}
		}
	}
}
