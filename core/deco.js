// abc2svg - deco.js - decorations
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

var	dd_tb = {},		// definition of the decorations
	a_de,			// array of the decoration elements
	od		// ottava: index = type + staff, value = counter + voice number

// decorations - populate with standard decorations
var decos = {
	dot: "0 stc 5 1 1",
	tenuto: "0 emb 5 3 3",
	slide: "1 sld 3 7 0",
	arpeggio: "2 arp 12 10 0",
	roll: "3 roll 7 6 6",
	fermata: "3 hld 12 7 7",
	emphasis: "3 accent 7 4 4",
	lowermordent: "3 lmrd 10 5 5",
	coda: "3 coda 24 10 10",
	uppermordent: "3 umrd 10 5 5",
	segno: "3 sgno 22 8 8",
	trill: "3 trl 14 5 5",
	upbow: "3 upb 10 5 5",
	downbow: "3 dnb 9 5 5",
	gmark: "3 grm 6 5 5",
	wedge: "3 wedge 8 3 3",		// (staccatissimo or spiccato)
	turnx: "3 turnx 10 0 5",
	breath: "3 brth 0 1 20",
	longphrase: "3 lphr 0 1 1",
	mediumphrase: "3 mphr 0 1 1",
	shortphrase: "3 sphr 0 1 1",
	invertedfermata: "3 hld 12 7 7",
	invertedturn: "3 turn 10 0 5",
	invertedturnx: "3 turnx 10 0 5",
	"0": "3 fng 8 3 3 0",
	"1": "3 fng 8 3 3 1",
	"2": "3 fng 8 3 3 2",
	"3": "3 fng 8 3 3 3",
	"4": "3 fng 8 3 3 4",
	"5": "3 fng 8 3 3 5",
	plus: "3 dplus 7 3 3",
	"+": "3 dplus 7 3 3",
	accent: "3 accent 6 4 4",
	">": "3 accent 6 4 4",
	marcato: "3 marcato 9 3 3",
	"^": "3 marcato 9 3 3",
	mordent: "3 lmrd 10 5 5",
	open: "3 opend 10 3 3",
	snap: "3 snap 14 3 3",
	thumb: "3 thumb 14 3 3",
	dacapo: "3 dacs 16 20 20 Da Capo",
	dacoda: "3 dacs 16 20 20 Da Coda",
	"D.C.": "3 dacs 16 10 10 D.C.",
	"D.S.": "3 dacs 16 10 10 D.S.",
	"D.C.alcoda": "3 dacs 16 38 38 D.C. al Coda",
	"D.S.alcoda": "3 dacs 16 38 38 D.S. al Coda",
	"D.C.alfine": "3 dacs 16 38 38 D.C. al Fine",
	"D.S.alfine": "3 dacs 16 38 38 D.S. al Fine",
	fine: "3 dacs 16 10 10 Fine",
	turn: "3 turn 10 0 5",
	"trill(": "3 ltr 8 0 0",
	"trill)": "3 ltr 8 0 0",
	f: "6 pf 18 1 7",
	ff: "6 pf 18 2 10",
	fff: "6 pf 18 4 13",
	ffff: "6 pf 18 6 16",
	mf: "6 pf 18 6 13",
	mp: "6 pf 18 6 16",
	p: "6 pf 18 2 8",
	pp: "6 pf 18 5 14",
	ppp: "6 pf 18 8 20",
	pppp: "6 pf 18 10 25",
	pralltriller: "3 umrd 10 5 5",
	sfz: '6 sfz 18 4 10 ""',
	ped: "4 ped 20 0 0",
	"ped-up": "4 pedoff 20 0 0",
	"crescendo(": "7 cresc 18 0 0",
	"crescendo)": "7 cresc 18 0 0",
	"<(": "7 cresc 18 0 0",
	"<)": "7 cresc 18 0 0",
	"diminuendo(": "7 dim 18 0 0",
	"diminuendo)": "7 dim 18 0 0",
	">(": "7 dim 18 0 0",
	">)": "7 dim 18 0 0",
	"-(": "8 gliss 0 0 0",
	"-)": "8 gliss 0 0 0",
	"~(": "8 glisq 0 0 0",
	"~)": "8 glisq 0 0 0",
	"8va(": "3 8va 10 0 0",
	"8va)": "3 8va 10 0 0",
	"8vb(": "4 8vb 10 0 0",
	"8vb)": "4 8vb 10 0 0",
	"15ma(": "3 15ma 10 0 0",
	"15ma)": "3 15ma 10 0 0",
	"15mb(": "4 15mb 10 0 0",
	"15mb)": "4 15mb 10 0 0",
// internal
//	color: "10 0 0 0 0",
	invisible: "32 0 0 0 0",
	beamon: "33 0 0 0 0",
	trem1: "34 0 0 0 0",
	trem2: "34 0 0 0 0",
	trem3: "34 0 0 0 0",
	trem4: "34 0 0 0 0",
	xstem: "35 0 0 0 0",
	beambr1: "36 0 0 0 0",
	beambr2: "36 0 0 0 0",
	rbstop: "37 0 0 0 0",
	"/": "38 0 0 6 6",
	"//": "38 0 0 6 6",
	"///": "38 0 0 6 6",
	"beam-accel": "39 0 0 0 0",
	"beam-rall": "39 0 0 0 0",
	stemless: "40 0 0 0 0",
	rbend: "41 0 0 0 0"},

	// types of decoration per function
	f_near = [true, true, true],
	f_note = [false, false, false, true, true, true, false, false, true],
	f_staff = [false, false, false, false, false, false, true, true]

/* -- get the max/min vertical offset -- */
function y_get(st, up, x, w) {
	var	y,
		p_staff = staff_tb[st],
		i = (x / realwidth * YSTEP) | 0,
		j = ((x + w) / realwidth * YSTEP) | 0

	if (i < 0)
		i = 0
	if (j >= YSTEP) {
		j = YSTEP - 1
		if (i > j)
			i = j
	}
	if (up) {
		y = p_staff.top[i++]
		while (i <= j) {
			if (y < p_staff.top[i])
				y = p_staff.top[i];
			i++
		}
	} else {
		y = p_staff.bot[i++]
		while (i <= j) {
			if (y > p_staff.bot[i])
				y = p_staff.bot[i];
			i++
		}
	}
	return y
}

/* -- adjust the vertical offsets -- */
function y_set(st, up, x, w, y) {
	var	p_staff = staff_tb[st],
		i = (x / realwidth * YSTEP) | 0,
		j = ((x + w) / realwidth * YSTEP) | 0

	/* (may occur when annotation on 'y' at start of an empty staff) */
	if (i < 0)
		i = 0
	if (j >= YSTEP) {
		j = YSTEP - 1
		if (i > j)
			i = j
	}
	if (up) {
		while (i <= j) {
			if (p_staff.top[i] < y)
				p_staff.top[i] = y;
			i++
		}
	} else {
		while (i <= j) {
			if (p_staff.bot[i] > y)
				p_staff.bot[i] = y;
			i++
		}
	}
}

/* -- get the staff position of the dynamic and volume marks -- */
function up_p(s, pos) {
	switch (pos) {
	case SL_ABOVE:
		return true
	case SL_BELOW:
		return false
	}
	if (s.multi && s.multi != 0)
		return s.multi > 0
	if (!s.p_v.have_ly)
		return false

	/* above if the lyrics are below the staff */
	return s.pos.voc != SL_ABOVE
}

/* -- drawing functions -- */
/* 2: special case for arpeggio */
function d_arp(de) {
	var	m, h, dx,
		s = de.s,
		dd = de.dd,
		xc = 5

	if (s.type == NOTE) {
		for (m = 0; m <= s.nhd; m++) {
			if (s.notes[m].acc) {
				dx = 5 + s.notes[m].shac
			} else {
				dx = 6 - s.notes[m].shhd
				switch (s.head) {
				case SQUARE:
					dx += 3.5
					break
				case OVALBARS:
				case OVAL:
					dx += 2
					break
				}
			}
			if (dx > xc)
				xc = dx
		}
	}
	h = 3 * (s.notes[s.nhd].pit - s.notes[0].pit) + 4;
	m = dd.h			/* minimum height */
	if (h < m)
		h = m;

	de.has_val = true;
	de.val = h;
//	de.x = s.x - xc;
	de.x -= xc;
	de.y = 3 * (s.notes[0].pit - 18) - 3
}

/* 7: special case for crescendo/diminuendo */
function d_cresc(de) {
	if (de.ldst)			// skip start of deco
		return
	var	s, dd, dd2, up, x, dx, x2, i,
		s2 = de.s,
		de2 = de.start,		/* start of the deco */
		de2_prev, de_next;

	s = de2.s;
	x = s.x + 3;
	i = de2.ix
	if (i > 0)
		de2_prev = a_de[i - 1];

	de.st = s2.st;
	de.lden = false;		/* old behaviour */
	de.has_val = true;
	up = up_p(s2, s2.pos.dyn)
	if (up)
		de.up = true

	// shift the starting point if any dynamic mark on the left
	if (de2_prev && de2_prev.s == s
	 && ((de.up && !de2_prev.up)
	  || (!de.up && de2_prev.up))) {
		dd2 = de2_prev.dd
		if (f_staff[dd2.func]) {	// if dynamic mark
			x2 = de2_prev.x + de2_prev.val + 4
			if (x2 > x)
				x = x2
		}
	}

	if (de.defl.noen) {		/* if no decoration end */
		dx = de.x - x
		if (dx < 20) {
			x = de.x - 20 - 3;
			dx = 20
		}
	} else {

		// shift the ending point if any dynamic mark on the right
		x2 = s2.x;
		de_next = a_de[de.ix + 1]
		if (de_next
		 && de_next.s == s
		 && ((de.up && !de_next.up)
		  || (!de.up && de_next.up))) {
			dd2 = de_next.dd
			if (f_staff[dd2.func])	// if dynamic mark
				x2 -= 5
		}
		dx = x2 - x - 4
		if (dx < 20) {
			x -= (20 - dx) * .5;
			dx = 20
		}
	}

	de.val = dx;
	de.x = x;
	de.y = y_get(de.st, up, x, dx)
	if (!up) {
		dd = de.dd;
		de.y -= dd.h
	}
	/* (y_set is done later in draw_deco_staff) */
}

/* 0: near the note (dot, tenuto) */
function d_near(de) {
	var	y, up,
		s = de.s,
		dd = de.dd

	if (dd.str) {			// annotation like decoration
//		de.x = s.x;
//		de.y = s.y;
		return
	}
	if (s.multi)
		up = s.multi > 0
	else
		up = s.stem < 0
	if (up)
		y = s.ymx | 0
	else
		y = (s.ymn - dd.h) | 0
	if (y > -6 && y < 24) {
		if (up)
			y += 3;
		y = (((y + 6) / 6) | 0) * 6 - 6		/* between lines */
	}
	if (up)
		s.ymx = y + dd.h
	else
		s.ymn = y;
	de.y = y
//	de.x = s.x + s.notes[s.stem >= 0 ? 0 : s.nhd].shhd
	if (s.type == NOTE)
		de.x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd
	if (dd.name[0] == 'd'			/* if dot decoration */
	 && s.nflags >= -1) {			/* on stem */
		if (up) {
			if (s.stem > 0)
				de.x += 3.5	// stem_xoff
		} else {
			if (s.stem < 0)
				de.x -= 3.5
		}
	}
}

/* 6: dynamic marks */
function d_pf(de) {
	var	dd2, x2, str, x, up,
		s = de.s,
		dd = de.dd,
		de_prev;

	de.val = dd.wl + dd.wr;
	up = up_p(s, s.pos.vol)
	if (up)
		de.up = true;
	x = s.x - dd.wl
	if (de.ix > 0) {
		de_prev = a_de[de.ix - 1]
		if (de_prev.s == s
		 && ((de.up && !de_prev.up)
		  || (!de.up && de_prev.up))) {
			dd2 = de_prev.dd
			if (f_staff[dd2.func]) {	/* if dynamic mark */
				x2 = de_prev.x + de_prev.val + 4;
				if (x2 > x)
					x = x2
			}
		}
	}

	de.x = x;
	de.y = y_get(s.st, up, x, de.val)
	if (!up)
		de.y -= dd.h
	/* (y_set is done later in draw_deco_staff) */
}

/* 1: special case for slide */
function d_slide(de) {
	var	m, dx,
		s = de.s,
		yc = s.notes[0].pit,
		xc = 5

	for (m = 0; m <= s.nhd; m++) {
		if (s.notes[m].acc) {
			dx = 4 + s.notes[m].shac
		} else {
			dx = 5 - s.notes[m].shhd
			switch (s.head) {
			case SQUARE:
				dx += 3.5
				break
			case OVALBARS:
			case OVAL:
				dx += 2
				break
			}
		}
		if (s.notes[m].pit <= yc + 3 && dx > xc)
			xc = dx
	}
//	de.x = s.x - xc;
	de.x -= xc;
	de.y = 3 * (yc - 18)
}

/* 5: special case for long trill */
function d_trill(de) {
	if (de.ldst)
		return
	var	dd, up, y, w, tmp,
		s2 = de.s,
		st = s2.st,
		s = de.start.s,
		x = s.x

	if (de.prev) {			// hack 'tr~~~~~'
		x = de.prev.x + 10;
		y = de.prev.y
	}
	de.st = st

	if (de.dd.func != 4) {		// if not below
		switch (de.dd.glyph) {
		case "8va":
		case "15ma":
			up = 1
			break
		default:
			up = s2.multi >= 0
			break
		}
	}
	if (de.defl.noen) {		/* if no decoration end */
		w = de.x - x
		if (w < 20) {
			x = de.x - 20 - 3;
			w = 20
		}
	} else {
		w = s2.x - x - 6
		if (s2.type == NOTE)
			w -= 6
		if (w < 20) {
			x -= (20 - w) * .5;
			w = 20
		}
	}
	dd = de.dd;
	if (!y)
		y = y_get(st, up, x, w)
	if (up) {
		tmp = staff_tb[s.st].topbar + 2
		if (y < tmp)
			y = tmp
	} else {
		y -= dd.h;
		tmp = staff_tb[s.st].botbar - 2
		if (y > tmp)
			y = tmp
	}
	de.lden = false;
	de.has_val = true;
	de.val = w;
	de.x = x;
	de.y = y
	if (up)
		y += dd.h;
	y_set(st, up, x, w, y)
	if (up)
		s.ymx = s2.ymx = y
	else
		s.ymn = s2.ymn = y
}

/* 3, 4: above (or below) the staff */
function d_upstaff(de) {

	// don't treat here the long decorations
	if (de.ldst)			// if long deco start
		return
	if (de.start) {			// if long decoration
		d_trill(de)
		return
	}
	var	yc, up, inv,
		s = de.s,
		dd = de.dd,
		x = s.x,
		w = dd.wl + dd.wr,
		stafft = staff_tb[s.st].topbar + 2,
		staffb = staff_tb[s.st].botbar - 2

	if (s.nhd)
		x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd;
	up = -1
	if (dd.func == 4) {		// below
		up = 0
	} else if (s.pos) {
		switch (s.pos.orn) {
		case SL_ABOVE:
			up = 1
			break
		case SL_BELOW:
			up = 0
			break
		}
	}

	switch (dd.glyph) {
	case "accent":
	case "roll":
		if (!up
		 || (up < 0
		  && (s.multi < 0
		   || (!s.multi && s.stem > 0)))) {
			yc = y_get(s.st, false, s.x - dd.wl, w)
			if (yc > staffb)
				yc = staffb;
			yc -= dd.h;
			y_set(s.st, false, s.x, 0, yc);
			inv = true;
			s.ymn = yc
		} else {
			yc = y_get(s.st, true, s.x, 0)
			if (yc < stafft)
				yc = stafft;
			y_set(s.st, true, s.x - dd.wl, w, yc + dd.h);
			s.ymx = yc + dd.h
		}
		break
	case "brth":
	case "lphr":
	case "mphr":
	case "sphr":
		yc = stafft + 1
		if (dd.glyph == "brth" && yc < s.ymx)
			yc = s.ymx
		for (s = s.ts_next; s; s = s.ts_next)
			if (s.shrink)
				break
		x += ((s ? s.x : realwidth) - x) * .4
		break
	default:
		if (dd.name.indexOf("invert") == 0)
			inv = true
		if (dd.name != "invertedfermata"
		 && (up > 0
		  || (up < 0 && s.multi >= 0))) {
			yc = y_get(s.st, true, s.x - dd.wl, w)
			if (yc < stafft)
				yc = stafft;
			y_set(s.st, true, s.x - dd.wl, w, yc + dd.h);
			s.ymx = yc + dd.h
		} else {
			yc = y_get(s.st, false, s.x - dd.wl, w)
			if (yc > staffb)
				yc = staffb;
			yc -= dd.h;
			y_set(s.st, false, s.x - dd.wl, w, yc)
			if (dd.name == "fermata")
				inv = true;
			s.ymn = yc
		}
		break
	}
	if (inv) {
		yc += dd.h;
		de.inv = true
	}
	de.x = x;
	de.y = yc
}

/* deco function table */
var func_tb = [
	d_near,		/* 0 - near the note */
	d_slide,	/* 1 */
	d_arp,		/* 2 */
	d_upstaff,	/* 3 - tied to note */
	d_upstaff,	/* 4 (below the staff) */
	d_trill,	/* 5 */
	d_pf,		/* 6 - tied to staff (dynamic marks) */
	d_cresc		/* 7 */
]

// add a decoration
/* syntax:
 *	%%deco <name> <c_func> <glyph> <h> <wl> <wr> [<str>]
 */
function deco_add(param) {
	var dv = param.match(/(\S*)\s+(.*)/);
	decos[dv[1]] = dv[2]
}

// define a decoration
function deco_def(nm) {
    var a, dd, dd2, name2, c, i, elts, str,
	text = decos[nm]

	if (!text) {
		if (cfmt.decoerr)
			error(1, null, "Unknown decoration '$1'", nm)
		return //undefined
	}

	// extract the values
	a = text.match(/(\d+)\s+(.+?)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/)
	if (!a) {
		error(1, null, "Invalid decoration '$1'", nm)
		return //undefined
	}
	var	c_func = Number(a[1]),
//		glyph = a[2],
		h = parseFloat(a[3]),
		wl = parseFloat(a[4]),
		wr = parseFloat(a[5])

	if (isNaN(c_func)) {
		error(1, null, "%%deco: bad C function value '$1'", a[1])
		return //undefined
	}
	if ((c_func < 0 || c_func > 10)
	 && (c_func < 32 || c_func > 41)) {
		error(1, null, "%%deco: bad C function index '$1'", c_func)
		return //undefined
	}
	if (h < 0 || wl < 0 || wr < 0) {
		error(1, null, "%%deco: cannot have a negative value '$1'", text)
		return //undefined
	}
	if (h > 50 || wl > 80 || wr > 80) {
		error(1, null, "%%deco: abnormal h/wl/wr value '$1'", text)
		return //undefined
	}

	// create/redefine the decoration
	dd = dd_tb[nm]
	if (!dd) {
		dd = {
			name: nm
		}
		dd_tb[nm] = dd
	}

	/* set the values */
	dd.func = dd.name.indexOf("head-") == 0 ? 9 : c_func;
	dd.glyph = a[2];
	dd.h = h;
	dd.wl = wl;
	dd.wr = wr;
	str = text.replace(a[0], '').trim()
	if (str) {				// optional string
		if (str[0] == '"')
			str = str.slice(1, -1);
		dd.str = str
	}

	/* compatibility */
	if (dd.func == 6 && dd.str == undefined)
		dd.str = dd.name

	// link the start and end of long decorations
	c = dd.name.slice(-1)
	if (c == '(' ||
	    (c == ')' && dd.name.indexOf('(') < 0)) {
		name2 = dd.name.slice(0, -1) + (c == '(' ? ')' : '(');
		dd2 = dd_tb[name2]
		if (dd2) {
			if (c == '(') {
				dd.dd_en = dd2;
				dd2.dd_st = dd
			} else {
				dd.dd_st = dd2;
				dd2.dd_en = dd
			}
		} else {
			dd2 = deco_def(name2)
			if (!dd2)
				return //undefined
		}
	}
	return dd
}

/* -- convert the decorations -- */
function deco_cnv(a_dcn, s, prev) {
	var	i, j, dd, dcn, note,
		nd = a_dcn.length

	for (i = 0; i < nd; i++) {
		dcn = a_dcn[i];
		dd = dd_tb[dcn]
		if (!dd) {
			dd = deco_def(dcn)
			if (!dd)
				continue
		}

		/* special decorations */
		switch (dd.func) {
		case 0:			// near
			if (s.type == BAR && dd.name == "dot") {
				s.bar_dotted = true
				break
			}
			// fall thru
		case 1:			// slide
		case 2:			// arp
//			if (s.type != NOTE && s.type != REST) {
			if (!s.notes) {
				error(1, s,
					errs.must_note_rest, dd.name)
				continue
			}
			break
		case 8:			// gliss
			if (s.type != NOTE) {
				error(1, s,
					errs.must_note, dd.name)
				continue
			}
			note = s.notes[s.nhd] // move to the upper note of the chord
			if (!note.a_dcn)
				note.a_dcn = []
			note.a_dcn.push(dd.name)
			continue
		case 9:			// alternate head
			if (!s.notes) {
				error(1, s,
					errs.must_note_rest, dd.name)
				continue
			}

			// move the alternate head of the chord to the notes
			for (j = 0; j <= s.nhd; j++) {
				note = s.notes[j]
				if (!note.a_dcn)
					note.a_dcn = []
				note.a_dcn.push(dd.name)
			}
			continue
		default:
			break
		case 10:		/* color */
			if (s.notes) {
				for (j = 0; j <= s.nhd; j++)
					s.notes[j].color = dd.name
			} else {
				s.color = dd.name
			}
			continue
		case 32:		/* invisible */
			s.invis = true
			continue
		case 33:		/* beamon */
			if (s.type != BAR) {
				error(1, s, "!beamon! must be on a bar")
				continue
			}
			s.beam_on = true
			continue
		case 34:		/* trem1..trem4 */
			if (s.type != NOTE
			 || !prev
			 || prev.type != NOTE
			 || s.nflags != prev.nflags) {
				error(1, s,
					"!$1! must be on the last of a couple of notes",
					dd.name)
				continue
			}
			s.trem2 = true;
			s.beam_end = true;
//			s.beam_st = false;
			prev.trem2 = true;
			prev.beam_st = true;
//			prev.beam_end = false;
			s.ntrem = prev.ntrem = Number(dd.name[4]);
			prev.nflags = --s.nflags;
			prev.head = ++s.head
			if (s.nflags > 0) {
				s.nflags += s.ntrem;
			} else {
				if (s.nflags <= -2) {
					s.stemless = true;
					prev.stemless = true
				}
				s.nflags = s.ntrem;
			}
			prev.nflags = s.nflags
			for (j = 0; j <= s.nhd; j++)
				s.notes[j].dur *= 2;
			for (j = 0; j <= prev.nhd; j++)
				prev.notes[j].dur *= 2
			continue
		case 35:		/* xstem */
			if (s.type != NOTE) {
				error(1, s, "!xstem! must be on a note")
				continue
			}
			s.xstem = true;
			s.nflags = 0		// beam break
			continue
		case 36:		/* beambr1 / beambr2 */
			if (s.type != NOTE) {
				error(1, s, errs.must_note, dd.name)
				continue
			}
			if (dd.name[6] == '1')
				s.beam_br1 = true
			else
				s.beam_br2 = true
			continue
		case 37:		/* rbstop */
			s.rbstop = 1	// open
			continue
		case 38:		/* /, // and /// = tremolo */
			if (s.type != NOTE) {
				error(1, s, errs.must_note, dd.name)
				continue
			}
			s.trem1 = true;
			s.ntrem = dd.name.length	/* 1, 2 or 3 */
			if (s.nflags > 0)
				s.nflags += s.ntrem
			else
				s.nflags = s.ntrem
			continue
		case 39:		/* beam-accel/beam-rall */
			if (s.type != NOTE) {
				error(1, s, errs.must_note, dd.name)
				continue
			}
			s.feathered_beam = dd.name[5] == 'a' ? 1 : -1;
			continue
		case 40:		/* stemless */
			s.stemless = true
			continue
		case 41:		/* rbend */
			s.rbstop = 2	// with end
			continue
		}

		// add the decoration in the symbol
		if (!s.a_dd)
			s.a_dd = []
		s.a_dd.push(dd)
	}
}

/* -- update the x position of a decoration -- */
// used to center the rests
function deco_update(s, dx) {
	var	i, de,
		nd = a_de.length

	for (i = 0; i < nd; i++) {
		de = a_de[i]
		if (de.s == s)
			de.x += dx
	}
}

/* -- adjust the symbol width -- */
function deco_width(s) {
	var	dd, i,
		wl = 0,
		a_dd = s.a_dd,
		nd = a_dd.length

	for (i = 0; i < nd; i++) {
		dd =  a_dd[i]
		switch (dd.func) {
		case 1:			/* slide */
			if (wl < 7)
				wl = 7
			break
		case 2:			/* arpeggio */
			if (wl < 14)
				wl = 14
			break
		}
	}
	if (wl != 0 && s.prev && s.prev.type == BAR)
		wl -= 3
	return wl
}

/* -- draw the decorations -- */
/* (the staves are defined) */
function draw_all_deco() {
	if (a_de.length == 0)
		return
	var	de, de2, dd, s, note, f, st, x, y, y2, ym, uf, i, str, a,
		new_de = [],
		ymid = []

	if (!cfmt.dynalign) {
		st = nstaff;
		y = staff_tb[st].y
		while (--st >= 0) {
			y2 = staff_tb[st].y;
			ymid[st] = (y + 24 + y2) * .5;
			y = y2
		}
	}

	while (1) {
		de = a_de.shift()
		if (!de)
			break
		dd = de.dd
		if (!dd)
			continue		// deleted

		if (dd.dd_en)			// start of long decoration
			continue

		// handle the stem direction
		s = de.s
		f = dd.glyph;
		i = f.indexOf('/')
		if (i > 0) {
			if (s.stem >= 0)
				f = f.slice(0, i)
			else
				f = f.slice(i + 1)
		}

		// no voice scale if staff decoration
		if (f_staff[dd.func])
			set_sscale(s.st)
		else
			set_scale(s);

		st = de.st;
		if (!staff_tb[st].topbar)
			continue		// invisible staff
		x = de.x;
//		y = de.y + staff_tb[st].y / staff_tb[st].staffscale
		y = de.y + staff_tb[st].y

		// update the coordinates if head decoration
		if (de.m != undefined) {
			note = s.notes[de.m];
			x += note.shhd * stv_g.scale;

		/* center the dynamic marks between two staves */
/*fixme: KO when deco on other voice and same direction*/
		} else if (f_staff[dd.func] && !cfmt.dynalign
			&& ((de.up && st > 0)
			 || (!de.up && st < nstaff))) {
			if (de.up)
				ym = ymid[--st]
			else
				ym = ymid[st++];
			ym -= dd.h * .5
			if ((de.up && y < ym)
			 || (!de.up && y > ym)) {
//				if (s.st > st) {
//					while (s.st != st)
//						s = s.ts_prev
//				} else if (s.st < st) {
//					while (s.st != st)
//						s = s.ts_next
//				}
				y2 = y_get(st, !de.up, de.x, de.val)
					+ staff_tb[st].y
				if (de.up)
					y2 -= dd.h
//fixme: y_set is not used later!
				if ((de.up && y2 > ym)
				 || (!de.up && y2 < ym)) {
					y = ym;
//					y_set(st, de.up, de.x, de.val,
//						(de.up ? y + dd.h : y)
//							- staff_tb[st].y)
				}
			}
		}

		// check if user JS decoration
		uf = user[f]
		if (uf && typeof(uf) == "function") {
			uf(x, y, de)
			continue
		}

		// check if user PS definition
		if (psdeco(f, x, y, de))
			continue

		anno_start(s, 'deco')
//		if (de.flags.grace) {
//			g_open(x, y, 0, .7, de.inv ? -.7 : 0);
//			x = y = 0
//		} else
		if (de.inv) {
			g_open(x, y, 0, 1, -1);
			x = y = 0
		}
		if (de.has_val) {
			if (dd.func != 2	// if not !arpeggio!
			 || stv_g.st < 0)	// or not staff scale
// || voice_tb[s.v].scale != 1)
				out_deco_val(x, y, f, de.val / stv_g.scale, de.defl)
			else
				out_deco_val(x, y, f, de.val, de.defl)
			if (de.defl.noen)
				new_de.push(de.start)	// to be continued next line
		} else if (dd.str != undefined
			&& dd.str != 'sfz') {
			str = dd.str
			if (str[0] == '@') {
				a = str.match(/^@([0-9.-]+),([0-9.-]+);?/);
				x += Number(a[1]);
				y += Number(a[2]);
				str = str.replace(a[0], "")
			}
//			out_deco_str(x, y + de.dy,	// - dd.h * .2,
			out_deco_str(x, y,		// - dd.h * .2,
					f, str)
		} else if (de.lden) {
			out_deco_long(x, y, de)
		} else {
			xygl(x, y, f)
		}
		if (stv_g.g)
			g_close();
		anno_stop(s, 'deco')
	}

	// keep the long decorations which continue on the next line
	a_de = new_de
}

/* -- create the decorations and define the ones near the notes -- */
/* (the staves are not yet defined) */
/* (delayed output) */
/* this function must be called first as it builds the deco element table */
    var	ottava = {"8va(":1, "8va)":1, "15ma(":1, "15ma)":1,
		"8vb(":1, "8vb)":1, "15mb(":1, "15mb)":1}
function draw_deco_near() {
    var	s, g

	// update starting old decorations
	function ldeco_update(s) {
		var	i, de,
//			x = s.ts_prev.x + s.ts_prev.wr
			x = s.x - s.wl,
			nd = a_de.length

		for (i = 0; i < nd; i++) {
			de = a_de[i];
			de.ix = i;
			de.s.x = de.x = x;
			de.defl.nost = true
		}
	}

	/* -- create the deco elements, and treat the near ones -- */
	function create_deco(s) {
		var	dd, k, l, pos, de, x,
			nd = s.a_dd.length

/*fixme:pb with decorations above the staff*/
		for (k = 0; k < nd; k++) {
			dd = s.a_dd[k]

			/* check if hidden */
			switch (dd.func) {
			default:
				pos = 0
				break
			case 3:				/* d_upstaff */
			case 4:
//fixme:trill does not work yet
			case 5:				/* trill */
				if (ottava[dd.name]) {	// only one ottava per staff
					x = dd.name.slice(0, -1) + s.st.toString()
					if (od[x]) {
						if (dd.name[dd.name.length - 1] == '(') {
							od[x]++
							continue
						}
						od[x]--
						if (s.v + 1 != od[x] >> 8
						 || !od[x])
							continue
						od[x] &= 0xff
					} else if (dd.name[dd.name.length - 1] == '(') {
						od[x] = 1 + ((s.v + 1) << 8)
					}
				}
				pos = s.pos.orn
				break
			case 6:				/* d_pf */
				pos = s.pos.vol
				break
			case 7:				/* d_cresc */
				pos = s.pos.dyn
				break
			}
			if (pos == SL_HIDDEN)
				continue

			de = {
				s: s,
				dd: dd,
				st: s.st,
				ix: a_de.length,
				defl: {},
				x: s.x,
				y: s.y,
//				dy: 0
			}
			a_de.push(de)
			if (dd.dd_en) {
				de.ldst = true
			} else if (dd.dd_st) {
//fixme: pb with "()"
				de.lden = true;
				de.defl.nost = true
			}

			if (!f_near[dd.func])	/* if not near the note */
				continue
			func_tb[dd.func](de)
		}
	} // create_deco()

	// create the decorations of note heads
	function create_dh(s, m) {
		var	f, str, de, uf, k, dcn, dd,
			note = s.notes[m],
			nd = note.a_dcn.length

		for (k = 0; k < nd; k++) {
			dcn = note.a_dcn[k];
			dd = dd_tb[dcn]
			if (!dd) {
				dd = deco_def(dcn)
				if (!dd)
					continue
			}

			switch (dd.func) {
			case 0:
			case 1:
			case 3:
			case 4:
			case 8:			// gliss
				break
			default:
//			case 2:			// arpeggio
//			case 5:			// trill
//			case 7:			// d_cresc
				error(1, null, "Cannot have !$1! on a head", dd.name)
				continue
			case 9:			// head replacement
				note.invis = true
				break
			case 10:		// color
				note.color = dd.name
				continue
			case 32:		// invisible
				note.invis = true
				continue
			case 40:		// stemless chord (abcm2ps behaviour)
				s.stemless = true
				continue
			}

//fixme: check if hidden?
			de = {
				s: s,
				dd: dd,
				st: s.st,
				m: m,
				ix: 0,
				defl: {},
				x: s.x,
				y: 3 * (note.pit - 18),
//				dy: 0
			}
			a_de.push(de)
			if (dd.dd_en) {
				de.ldst = true
			} else if (dd.dd_st) {
				de.lden = true;
				de.defl.nost = true
			}
		}
	} // create_dh()

	// create all decoration of a note (chord and heads)
	function create_all(s) {
		var m

		if (s.a_dd)
			create_deco(s)
		if (s.notes) {
			for (m = 0; m < s.notes.length; m++) {
				if (s.notes[m].a_dcn)
					create_dh(s, m)
			}
		}
	} // create_all()

	// link the long decorations
	function ll_deco() {
		var	i, j, de, de2, dd, dd2, v, s, st,
			n_de = a_de.length

		// add ending decorations
		for (i = 0; i < n_de; i++) {
			de = a_de[i]
			if (!de.ldst)	// not the start of long decoration
				continue
			dd = de.dd;
			dd2 = dd.dd_en;
			s = de.s;
			v = s.v			// search later in the voice
			for (j = i + 1; j < n_de; j++) {
				de2 = a_de[j]
				if (!de2.start
				 && de2.dd == dd2 && de2.s.v == v)
					break
			}
			if (j == n_de) {	// no end, search in the staff
				st = s.st;
				for (j = i + 1; j < n_de; j++) {
					de2 = a_de[j]
					if (!de2.start
					 && de2.dd == dd2 && de2.s.st == st)
						break
				}
			}
			if (j == n_de) {	// no end, insert one
				de2 = {
					s: de.s,
					st: de.st,
					dd: dd2,
					ix: a_de.length - 1,
					x: realwidth - 6,
					y: de.s.y,
					lden: true,
					defl: {
						noen: true
					}
				}
				if (de2.x < s.x + 10)
					de2.x = s.x + 10
				if (de.m != undefined)
					de2.m = de.m;
				a_de.push(de2)
			}
			de2.start = de;
			de2.defl.nost = de.defl.nost

			// handle 'tr~~~~~'
			if (dd.name == "trill("
			 && i > 0 && a_de[i - 1].dd.name == "trill")
				de2.prev = a_de[i - 1]
		}

		// add starting decorations
		for (i = 0; i < n_de; i++) {
			de2 = a_de[i]
			if (!de2.lden	// not the end of long decoration
			 || de2.start)	// start already found
				continue
			s = de2.s;
			de = {
				s: prev_scut(s),
				st: de2.st,
				dd: de2.dd.dd_st,
				ix: a_de.length - 1,
//				x: s.x - s.wl - 4,
				y: s.y,
				ldst: true
			}
			de.x = de.s.x
			if (de2.m != undefined)
				de.m = de2.m;
			a_de.push(de);
			de2.start = de
		}
	} // ll_deco

	// update the long decorations started in the previous line
	for (s = tsfirst ; s; s = s.ts_next) {
		switch (s.type) {
		case CLEF:
		case KEY:
		case METER:
			continue
		}
		break
	}
	if (a_de.length != 0)
		ldeco_update(s)

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
		case BAR:
		case MREST:
		case NOTE:
		case REST:
		case SPACE:
			break
		case GRACE:
			for (g = s.extra; g; g = g.next)
				create_all(g)
		default:
			continue
		}
		create_all(s)
	}
	ll_deco()			// link the long decorations
}

/* -- define the decorations tied to a note -- */
/* (the staves are not yet defined) */
/* (delayed output) */
function draw_deco_note() {
	var	i, de, dd, f,
		nd = a_de.length

	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd;
		f = dd.func
		if (f_note[f]
		 && de.m == undefined)
			func_tb[f](de)
	}
}

// -- define the music elements tied to the staff --
//	- decoration tied to the staves
//	- chord symbols
//	- repeat brackets
/* (the staves are not yet defined) */
/* (unscaled delayed output) */
function draw_deco_staff() {
	var	s, first_gchord, p_voice, x, y, w, i, v, de, dd,
		gch, gch2, ix, top, bot,
		minmax = new Array(nstaff),
		nd = a_de.length

	/* draw the repeat brackets */
	function draw_repbra(p_voice) {
		var s, s1, y, y2, i, p, w, wh, first_repeat;

		/* search the max y offset */
		y = staff_tb[p_voice.st].topbar + 25	// 20 (vert bar) + 5 (room)
		for (s = p_voice.sym; s; s = s.next) {
			if (s.type != BAR)
				continue
			if (!s.rbstart || s.norepbra)
				continue
/*fixme: line cut on repeat!*/
			if (!s.next)
				break
			if (!first_repeat) {
				first_repeat = s;
				set_font("repeat")
			}
			s1 = s
			for (;;) {
				if (!s.next)
					break
				s = s.next
				if (s.rbstop)
					break
			}
			y2 = y_get(p_voice.st, true, s1.x, s.x - s1.x)
			if (y < y2)
				y = y2

			/* have room for the repeat numbers */
			if (s1.text) {
				wh = strwh(s1.text);
				y2 = y_get(p_voice.st, true, s1.x + 4, wh[0]);
				y2 += wh[1]
				if (y < y2)
					y = y2
			}
			if (s.rbstart)
				s = s.prev
		}

		/* draw the repeat indications */
		s = first_repeat
		if (!s)
			return
		set_dscale(p_voice.st, true);
		y2 =  y * staff_tb[p_voice.st].staffscale
		for ( ; s; s = s.next) {
			if (!s.rbstart || s.norepbra)
				continue
			s1 = s
			while (1) {
				if (!s.next)
					break
				s = s.next
				if (s.rbstop)
					break
			}
			if (s1 == s)
				break
			x = s1.x
//			if (s1.bar_type[0] == ":")
//				x -= 4;
			if (s.type != BAR) {
				w = s.rbstop ? 0 : s.x - realwidth + 4
			} else if ((s.bar_type.length > 1	// if complex bar
				 && s.bar_type != "[]")
				|| s.bar_type == "]") {
//				if (s.bar_type == "]")
//					s.invis = true
//fixme:%%staves: cur_sy moved?
				if (s1.st > 0
				 && !(cur_sy.staves[s1.st - 1].flags & STOP_BAR))
					w = s.wl
				else if (s.bar_type.slice(-1) == ':')
					w = 12
				else if (s.bar_type[0] != ':')
//				      || s.bar_type == "]")
					w = 0		/* explicit repeat end */
				else
					w = 8
			} else {
				w = s.rbstop ? 0 : 8
			}
			w = (s.x - x - w)	// / staff_tb[p_voice.st].staffscale;

			if (!s.next		// 2nd ending at end of line
			 && !s.rbstop
			 && !p_voice.bar_start) { // continue on next line
				p_voice.bar_start = clone(s);
				p_voice.bar_start.type = BAR;
				p_voice.bar_start.bar_type = "["
				delete p_voice.bar_start.text;
				p_voice.bar_start.rbstart = 1
				delete p_voice.bar_start.a_gch
			}
			if (s1.text)
				xy_str(x + 4, y2 - gene.curfont.size - 3,
					s1.text);
			xypath(x, y2);
			if (s1.rbstart == 2)
				output += 'm0 20v-20';
			output+= 'h' + w.toFixed(2)
			if (s.rbstop == 2)
				output += 'v20';
			output += '"/>\n';
			y_set(s1.st, true, x, w, y + 2)

			if (s.rbstart)
				s = s.prev
		}
	} // draw_repbra()

	/* create the decorations tied to the staves */
	for (i = 0; i <= nstaff; i++)
		minmax[i] = {
			ymin: 0,
			ymax: 0
		}
	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd
		if (!dd)		// if error
			continue
		if (!f_staff[dd.func]	/* if not tied to the staff */
		 || de.m != undefined)	// or head decoration
			continue
		func_tb[dd.func](de)
		if (dd.dd_en)		// if start
			continue
		if (cfmt.dynalign) {
			if (de.up) {
				if (de.y > minmax[de.st].ymax)
					minmax[de.st].ymax = de.y
			} else {
				if (de.y < minmax[de.st].ymin)
					minmax[de.st].ymin = de.y
			}
		}
	}

	/* and, if wanted, set them at a same vertical offset */
	for (i = 0; i < nd; i++) {
		de = a_de[i];
		dd = de.dd
		if (!dd)		// if error
			continue
		if (dd.dd_en		// if start
		 || !f_staff[dd.func])
			continue
		if (cfmt.dynalign) {
			if (de.up)
				y = minmax[de.st].ymax
			else
				y = minmax[de.st].ymin;
			de.y = y
		} else {
			y = de.y
		}
		if (de.up)
			y += dd.h;
		y_set(de.st, de.up, de.x, de.val, y)
	}

	// search the vertical offset for the chord symbols
	for (i = 0; i <= nstaff; i++)
		minmax[i] = {
			ymin: 0,
			ymax: 24
		}
	for (s = tsfirst; s; s = s.ts_next) {
		if (!s.a_gch)
			continue
		if (!first_gchord)
			first_gchord = s;
		gch2 = null
		for (ix = 0; ix < s.a_gch.length; ix++) {
			gch = s.a_gch[ix]
			if (gch.type != 'g')
				continue
			gch2 = gch	// chord closest to the staff
			if (gch.y < 0)
				break
		}
		if (gch2) {
			w = gch2.w
			if (gch2.y >= 0) {
				y = y_get(s.st, true, s.x, w)
				if (y > minmax[s.st].ymax)
					minmax[s.st].ymax = y
			} else {
				y = y_get(s.st, false, s.x, w)
				if (y < minmax[s.st].ymin)
					minmax[s.st].ymin = y
			}
		}
	}

	// draw the chord symbols if any
	if (first_gchord) {
		for (i = 0; i <= nstaff; i++) {
			bot = staff_tb[i].botbar;
			if (minmax[i].ymin > bot - 4)
				minmax[i].ymin = bot - 4
			top = staff_tb[i].topbar;
			if (minmax[i].ymax < top + 4)
				minmax[i].ymax = top + 4
		}
		set_sscale(-1)		/* restore the scale parameters */
		for (s = first_gchord; s; s = s.ts_next) {
			if (!s.a_gch)
				continue
			draw_gchord(s, minmax[s.st].ymin, minmax[s.st].ymax)
		}
	}

	/* draw the repeat brackets */
	for (v = 0; v < voice_tb.length; v++) {
		p_voice = voice_tb[v]
		if (p_voice.second || !p_voice.sym)
			continue
		draw_repbra(p_voice)
	}
}

/* -- draw the measure bar numbers -- */
/* (scaled delayed output) */
function draw_measnb() {
	var	s, st, bar_num, x, y, w, any_nb, font_size,
		sy = cur_sy

	/* search the top staff */
	for (st = 0; st <= nstaff; st++) {
		if (sy.st_print[st])
			break
	}
	if (st > nstaff)
		return				/* no visible staff */
	set_dscale(st)

	/* leave the measure numbers as unscaled */
	if (staff_tb[st].staffscale != 1) {
		font_size = get_font("measure").size;
		param_set_font("measurefont", "* " +
			(font_size / staff_tb[st].staffscale).toString())
	}
	set_font("measure");

	s = tsfirst;				/* clef */
	bar_num = gene.nbar
	if (bar_num > 1) {
		if (cfmt.measurenb == 0) {
			any_nb = true;
			y = y_get(st, true, 0, 20)
			if (y < staff_tb[st].topbar + 14)
				y = staff_tb[st].topbar + 14;
			if (cfmt.measurebox)
				xy_str_b(0, y, bar_num.toString())
			else
				xy_str(0, y, bar_num.toString());
			y_set(st, true, 0, 20, y + gene.curfont.size + 2)
		} else if (bar_num % cfmt.measurenb == 0) {
			for ( ; ; s = s.ts_next) {
				switch (s.type) {
				case METER:
				case CLEF:
				case KEY:
				case STBRK:
					continue
				}
				break
			}
			while (s.st != st)
				s = s.ts_next

			// don't display the number twice
		     if (s.type != BAR || !s.bar_num) {
			if (s.prev && s.prev.type != CLEF)
				s = s.prev;
			x = s.x - s.wl;
			any_nb = true;
			w = cwid('0') * gene.curfont.swfac
			if (bar_num >= 10)
				w *= bar_num >= 100 ? 3 : 2
			if (cfmt.measurebox)
				w += 4;
			y = y_get(st, true, x, w)
			if (y < staff_tb[st].topbar + 6)
				y = staff_tb[st].topbar + 6;
			y += 2;
			if (cfmt.measurebox) {
				xy_str_b(x, y, bar_num.toString());
				y += 2;
				w += 3
			} else {
				xy_str(x, y, bar_num.toString())
			}
			y += gene.curfont.size;
			y_set(st, true, x, w, y);
			s.ymx = y
		     }
		}
	}

	for ( ; s; s = s.ts_next) {
		switch (s.type) {
		case STAVES:
			sy = s.sy
			for (st = 0; st < nstaff; st++) {
				if (sy.st_print[st])
					break
			}
			set_sscale(st)
			continue
		default:
			continue
		case BAR:
			if (!s.bar_num)
				continue
			break
		}

		bar_num = s.bar_num
		if (cfmt.measurenb == 0
		 || (bar_num % cfmt.measurenb) != 0
		 || !s.next)
			continue
		if (!any_nb)
			any_nb = true;
		w = cwid('0') * gene.curfont.swfac
		if (bar_num >= 10)
			w *= bar_num >= 100 ? 3 : 2
		if (cfmt.measurebox)
			w += 4;
		x = s.x - w * .4;
		y = y_get(st, true, x, w)
		if (y < staff_tb[st].topbar + 6)
			y = staff_tb[st].topbar + 6
		if (s.next.type == NOTE) {
			if (s.next.stem > 0) {
				if (y < s.next.ys - gene.curfont.size)
					y = s.next.ys - gene.curfont.size
			} else {
				if (y < s.next.y)
					y = s.next.y
			}
		}
		y += 2;
		if (cfmt.measurebox) {
			xy_str_b(x, y, bar_num.toString());
			y += 2;
			w += 3
		} else {
			xy_str(x, y, bar_num.toString())
		}
		y += gene.curfont.size;
		y_set(st, true, x, w, y);
		s.ymx = y
	}
	gene.nbar = bar_num

	if (font_size)
		param_set_font("measurefont", "* " + font_size.toString());
}

/* -- draw the note of the tempo -- */
function draw_notempo(s, x, y, dur, sc) {
	var	dx, p, dotx,
		elts = identify_note(s, dur),
		head = elts[0],
		dots = elts[1],
		nflags = elts[2]

//useless
//	// protection against end of container
//	if (stv_g.started) {
//		output += "</g>\n";
//		stv_g.started = false
//	}

	out_XYAB('<g transform="translate(X,Y) scale(F)">\n',
		x + 4, y + 5, sc)
	switch (head) {
	case OVAL:
		p = "HD"
		break
	case EMPTY:
		p = "Hd"
		break
	default:
		p = "hd"
		break
	}
	xygl(-posx, posy, p);
	dx = 4
	if (dots) {
		dotx = 9
		if (nflags > 0)
			dotx += 4
		switch (head) {
		case SQUARE:
			dotx += 3
			break
		case OVALBARS:
		case OVAL:
			dotx += 2
			break
		case EMPTY:
			dotx += 1
			break
		}
		dx = dotx * dots;
		dotx -= posx
		while (--dots >= 0) {
			xygl(dotx, posy, "dot");
			dotx += 3.5
		}
	}
	if (dur < BASE_LEN) {
		if (nflags <= 0) {
			out_stem(-posx, posy, 21)		// stem height
		} else {
			out_stem(-posx, posy, 21, false, nflags)
			if (dx < 6)
				dx = 6
		}
	}
	output += '</g>\n'
	return (dx + 15) * sc
}

/* -- estimate the tempo width -- */
function tempo_width(s) {
	var	w = 0;

	set_font("tempo")
	if (s.tempo_str1)
		w = strwh(s.tempo_str1)[0]
	if (s.tempo_ca)
		w += strwh(s.tempo_ca)[0]
	if (s.tempo_notes)
		w += 10 * s.tempo_notes.length +
			6 + cwid(' ') * gene.curfont.swfac * 6 + 10
	if (s.tempo_str2)
		w += strwh(s.tempo_str2)[0]
	return w
}

/* - output a tempo --*/
function write_tempo(s, x, y) {
	var	j, dx,
		sc = .6 * gene.curfont.size / 15.0; //fixme: 15.0 = initial tempofont

	set_font("tempo")
	if (s.tempo_str1) {
		xy_str(x, y, s.tempo_str1);
		x += strwh(s.tempo_str1)[0] + 3
	}
	if (s.tempo_notes) {
		for (j = 0; j < s.tempo_notes.length; j++)
			x += draw_notempo(s, x, y, s.tempo_notes[j], sc);
		xy_str(x, y, "=");
		x += strwh("= ")[0]
		if (s.tempo_ca) {
			xy_str(x, y, s.tempo_ca);
			x += strwh(s.tempo_ca)[0]
		}
		if (s.tempo) {
			xy_str(x, y, s.tempo.toString());
			dx = cwid('0') * gene.curfont.swfac;
			x += dx + 5
			if (s.tempo >= 10) {
				x += dx
				if (s.tempo >= 100)
					x += dx
			}
		} else {
			x += draw_notempo(s, x, y, s.new_beat, sc)
		}
	}
	if (s.tempo_str2)
		xy_str(x, y, s.tempo_str2)

	// don't display anymore
	s.del = true
}

/* -- draw the parts and the tempo information -- */
/* (the staves are being defined) */
function draw_partempo(st, top) {
	var	s, some_part, some_tempo, h, w, y,
		dy = 0,		/* put the tempo indication at top */
		ht = 0

	/* get the minimal y offset */
	var	ymin = staff_tb[st].topbar + 8,
		dosh = 0,
		shift = 1,
		x = 0
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.type != TEMPO || s.del)
			continue
		if (!some_tempo)
			some_tempo = s;
		w = tempo_width(s);
		y = y_get(st, true, s.x - 16, w)
		if (y > ymin)
			ymin = y
		if (x >= s.x - 16 && !(dosh & (shift >> 1)))
			dosh |= shift;
		shift <<= 1;
		x = s.x - 16 + w
	}
	if (some_tempo) {
		set_sscale(-1);
		set_font("tempo");
		ht = gene.curfont.size + 2 + 2;
		y = 2 - ht;
		h = y - ht
		if (dosh != 0)
			ht *= 2
		if (top < ymin + ht)
			dy = ymin + ht - top

		/* draw the tempo indications */
		for (s = some_tempo; s; s = s.ts_next) {
			if (s.type != TEMPO
			 || s.del)		// (displayed by %%titleformat)
				continue
			if (user.anno_start || user.anno_stop) {
				s.wl = 16;
				s.wr = 30;
				s.ymn = (dosh & 1) ? h : y;
				s.ymx = s.ymn + 14;
				anno_start(s)
			}
			write_tempo(s, s.x - 16, (dosh & 1) ? h : y);
			anno_stop(s);
			dosh >>= 1
		}
	}

	/* then, put the parts */
/*fixme: should reduce vertical space if parts don't overlap tempo...*/
	ymin = staff_tb[st].topbar + 8
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.type != PART)
			continue
		if (!some_part) {
			some_part = s;
			set_font("parts");
			h = gene.curfont.size + 2 + 2
						/* + cfmt.partsspace ?? */
		}
		w = strwh(s.text)[0];
		y = y_get(st, true, s.x - 10, w + 3)
		if (ymin < y)
			ymin = y
	}
	if (some_part) {
		set_sscale(-1)
		if (top < ymin + h + ht)
			dy = ymin + h + ht - top

		for (s = some_part; s; s = s.ts_next) {
			if (s.type != PART)
				continue
			s.x -= 10;
			if (user.anno_start || user.anno_stop) {
				w = strwh(s.text)[0];
				s.wl = 0;
				s.wr = w;
				s.ymn = -ht - h;
				s.ymx = s.ymn + h;
				anno_start(s)
			}
			if (cfmt.partsbox)
				xy_str_b(s.x, 2 - ht - h, s.text)
			else
				xy_str(s.x, 2 - ht - h, s.text)
			anno_stop(s)
		}
	}
	return dy
}
