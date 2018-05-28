// abc2svg - parse.js - ABC parse
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

var	a_gch,		// array of parsed guitar chords
	a_dcn,		// array of parsed decoration names
	multicol,	// multi column object
	maps = {}	// maps object - hashcode = map name
			//	-> object - hashcode = note
			//	[0] array of heads
			//	[1] print
			//	[2] color
var	qplet_tb = new Int8Array([ 0, 1, 3, 2, 3, 0, 2, 0, 3, 0 ]),
	ntb = "CDEFGABcdefgab"


// set the source references of a symbol
function set_ref(s) {
	s.fname = parse.fname;
	s.istart = parse.istart;
	s.iend = parse.iend
}

// -- %% pseudo-comment

// clef definition (%%clef, K: and V:)
function new_clef(clef_def) {
	var	s = {
			type: CLEF,
			clef_line: 2,
			clef_type: "t",
			v: curvoice.v,
			p_v: curvoice,
			time: curvoice.time,
			dur: 0
		},
		i = 1

	set_ref(s)

	switch (clef_def[0]) {
	case '"':
		i = clef_def.indexOf('"', 1);
		s.clef_name = clef_def.slice(1, i);
		i++
		break
	case 'a':
		if (clef_def[1] == 'u') {	// auto
			s.clef_type = "a";
			s.clef_auto = true;
			i = 4
			break
		}
		i = 4				// alto
	case 'C':
		s.clef_type = "c";
		s.clef_line = 3
		break
	case 'b':				// bass
		i = 4
	case 'F':
		s.clef_type = "b";
		s.clef_line = 4
		break
	case 'n':				// none
		i = 4
		s.invis = true
		break
	case 't':
		if (clef_def[1] == 'e') {	// tenor
			s.clef_type = "c";
			s.clef_line = 4
			break
		}
		i = 6
	case 'G':
//		s.clef_type = "t"		// treble
		break
	case 'p':
		i = 4
	case 'P':				// perc
		s.clef_type = "p";
		s.clef_line = 3;
		curvoice.key.k_sf = 0		// no accidental
		break
	default:
		syntax(1, "Unknown clef '$1'", clef_def)
		return //undefined
	}
	if (clef_def[i] >= '1' && clef_def[i] <= '9') {
		s.clef_line = Number(clef_def[i]);
		i++
	}
	if (clef_def[i + 1] != '8')
		return s
	switch (clef_def[i]) {			// octave
	case '^':
		s.clef_oct_transp = true
	case '+':
		s.clef_octave = 7
		break
	case '_':
		s.clef_oct_transp = true
	case '-':
		s.clef_octave = -7
		break
	}
	return s
}

// get a transposition value
function get_transp(param,
			type) {		// undefined or "instr"
	var	i, val, tmp, note,
		pit = []

	if (param[0] == '0')
		return 0
	if ("123456789-+".indexOf(param[0]) >= 0) {	// by semi-tone
		val = parseInt(param) * 3
		if (isNaN(val) || val < -108 || val > 108) {
//fixme: no source reference...
			syntax(1, "Bad transpose value")
			return
		}
		switch (param.slice(-1)) {
		default:
			return val
		case '#':
			val++
			break
		case 'b':
			val += 2
			break
		}
		if (val > 0)
			return val
		return val - 3
	}

	// by music interval
	if (type == "instr") {	// convert instrument= into score= or sound=
		tmp = param.indexOf('/')
		if (!cfmt.sound) {
			if (tmp < 0)
				return 0	// written pitch
			param = param.replace('/', '')
		} else {
			if (tmp < 0)
				param = 'c' + param
			else
				param = param.replace(/.*\//, 'c')
		}
	}

	tmp = new scanBuf();
	tmp.buffer = param
	for (i = 0; i < 2; i++) {
		note = parse_acc_pit(tmp)
		if (!note) {
			syntax(1, "Bad transpose value")
			return
		}
		note.pit += 124;	// 126 - 2 for value > 0 and 'C' % 7 == 0
		val = ((note.pit / 7) | 0) * 12 + note_pit[note.pit % 7]
		if (note.acc && note.acc != 3)		// if not natural
			val += note.acc;
		pit[i] = val
	}
	if (cfmt.sound)
		pit[0] = 252;			// 'c'

	val = (pit[1] - pit[0]) * 3
	if (note) {
		switch (note.acc) {
		default:
			return val
		case 2:
		case 1:
			val++
			break
		case -1:
		case -2:
			val += 2
			break
		}
	}
	if (val > 0)
		return val
	return val - 3
}

// set the linebreak character
function set_linebreak(param) {
	var i, item

	for (i = 0; i < 128; i++) {
		if (char_tb[i] == "\n")
			char_tb[i] = nil	// remove old definition
	}
	param = param.split(/\s+/)
	for (i = 0; i < param.length; i++) {
		item = param[i]
		switch (item) {
		case '!':
		case '$':
		case '*':
		case ';':
		case '?':
		case '@':
			break
		case "<none>":
			continue
		case "<EOL>":
			item = '\n'
			break
		default:
			syntax(1, "Bad value '$1' in %%linebreak - ignored",
					item)
			continue
		}
		char_tb[item.charCodeAt(0)] = '\n'
	}
}

// set a new user character (U: or %%user)
function set_user(parm) {
    var	k, c, v,
	a = parm.match(/(.*?)[= ]*([!"].*[!"])/)

	if (!a) {
		syntax(1, 'Lack of starting ! or " in U: / %%user')
		return
	}
	c = a[1];
	v = a[2]
	if (v.slice(-1) != v[0]) {
		syntax(1, "Lack of ending $1 in U:/%%user", v[0])
		return
	}
	if (c[0] == '\\') {
		if (c[1] == 't')
			c = '\t'
		else if (!c[1])
			c = ' '
	}

	k = c.charCodeAt(0)
	if (k >= 128) {
		syntax(1, errs.not_ascii)
		return
	}
	switch (char_tb[k][0]) {
	case '0':			// nil
	case 'd':
	case 'i':
	case ' ':
		break
	case '"':
	case '!':
		if (char_tb[k].length > 1)
			break
		// fall thru
	default:
		syntax(1, "Bad user character '$1'", c)
		return
	}
	switch (v) {
	case "!beambreak!":
		v = " "
		break
	case "!ignore!":
		v = "i"
		break
	case "!nil!":
	case "!none!":
		v = "d"
		break
	}
	char_tb[k] = v
}

// get a stafflines value
function get_st_lines(param) {
	var n, val

	if (!param)
		return
	if (/^[\]\[|.-]+$/.test(param))
		return param.replace(/\]/g, '[')

	n = parseInt(param)
	switch (n) {
	case 0: return "..."
	case 1: return "..|"
	case 2: return ".||"
	case 3: return ".|||"
	}
	if (isNaN(n) || n < 0 || n > 16)
		return //undefined
	val = '|'
	while (--n > 0)
		val += '|'
	return val
}

// create a block symbol in the tune body
function new_block(subtype) {
	var	s = {
			type: BLOCK,
			subtype: subtype,
			dur: 0
		}

	if (parse.state == 2)
		goto_tune()
	var voice_s = curvoice;
	curvoice = voice_tb[par_sy.top_voice]
	sym_link(s);
	curvoice = voice_s
	return s
}

// set the voice parameters
function set_vp(a) {
    var	s, item, pos, val, clefpit

	while (1) {
		item = a.shift()
		if (!item)
			break
		if (item[item.length - 1] == '='
		 && a.length == 0) {
			syntax(1, errs.bad_val, item)
			break
		}
		switch (item) {
		case "clef=":
			s = a.shift()		// keep last clef
			break
		case "clefpitch=":
			item = a.shift()		// (<note><octave>)
			if (item) {
				val = ntb.indexOf(item[0])
				if (val >= 0) {
					switch (item[1]) {
					case "'":
						val += 7
						break
					case ',':
						val -= 7
						if (item[2] == ',')
							val -= 7
						break
					}
					clefpit = 4 - val	// 4 = 'G'
					break
				}
			}
			syntax(1, errs.bad_val, item)
			break
		case "octave=":
		case "uscale=":			// %%microscale
			val = parseInt(a.shift())
			if (isNaN(val))
				syntax(1, errs.bad_val, item)
			else
				curvoice[item.slice(0, -1)] = val
			break
		case "cue=":
			curvoice.scale = a.shift() == 'on' ? .7 : 1
			break
		case "instrument=":
			curvoice.transp = get_transp(a.shift(), 'instr')
			break
		case "map=":			// %%voicemap
			if (cfmt.sound != "play")
				curvoice.map = a.shift()
			break
		case "name=":
		case "nm=":
			curvoice.nm = a.shift()
			if (curvoice.nm[0] == '"')
				curvoice.nm = curvoice.nm.slice(1, -1);
			curvoice.new_name = true
			break
		case "stem=":
		case "pos=":
			if (item == "pos=")
				item = a.shift().split(' ')
			else
				item = ["stm", a.shift()];
			val = posval[item[1]]
			if (val == undefined) {
				syntax(1, errs.bad_val, item[0])
				break
			}
			if (!pos)
				pos = {}
			pos[item[0]] = val
			break
		case "scale=":			// %%voicescale
			val = parseFloat(a.shift())
			if (isNaN(val) || val < .6 || val > 1.5)
				syntax(1, errs.bad_val, "%%voicescale")
			else
				curvoice.scale = val
			break
		case "score=":
			if (cfmt.sound)
				break
			item = a.shift()
			if (item.indexOf('/') < 0)
				item += '/c';
			curvoice.transp = get_transp(item)
			break
		case "shift=":
			curvoice.shift = get_transp(a.shift())
			break
		case "sound=":
		case "transpose=":		// (abcMIDI compatibility)
			if (!cfmt.sound)
				break
			curvoice.transp = get_transp(a.shift())
			break
		case "subname=":
		case "sname=":
		case "snm=":
			curvoice.snm = a.shift()
			if (curvoice.snm[0] == '"')
				curvoice.snm = curvoice.snm.slice(1, -1);
			break
		case "stafflines=":
			val = get_st_lines(a.shift())
			if (val == undefined)
				syntax(1, "Bad %%stafflines value")
			else
				curvoice.stafflines = val
			break
		case "staffnonote=":
			val = parseInt(a.shift())
			if (isNaN(val))
				syntax(1, "Bad %%staffnonote value")
			else
				curvoice.staffnonote = val
			break
		case "staffscale=":
			val = parseFloat(a.shift())
			if (isNaN(val) || val < .3 || val > 2)
				syntax(1, "Bad %%staffscale value")
			else
				curvoice.staffscale = val
			break
		default:
			switch (item.slice(0, 4)) {
			case "treb":
			case "bass":
			case "alto":
			case "teno":
			case "perc":
				s = item
				break
			default:
				if ("GFC".indexOf(item[0]) >= 0)
					s = item
				else if (item.slice(-1) == '=')
					a.shift()
				break
			}
			break
		}
	}
	if (pos) {
		curvoice.pos = clone(curvoice.pos)
		for (item in pos)
			if (pos.hasOwnProperty(item))
				curvoice.pos[item] = pos[item]
	}

	if (s) {
		s = new_clef(s)
		if (s) {
			if (clefpit)
				s.clefpit = clefpit
			get_clef(s)
		}
	}
} // set_vp()

// set the K: / V: parameters
function set_kv_parm(a) {	// array of items
	if (!curvoice.init) {	// add the global parameters if not done yet
		curvoice.init = true
		if (info.V) {
			if (info.V['*'])
				a = info.V['*'].concat(a)
			if (info.V[curvoice.id])
				a = info.V[curvoice.id].concat(a)
		}
	}
	if (a.length != 0)
		set_vp(a)
} // set_kv_parm()

// memorize the K:/V: parameters
function memo_kv_parm(vid,	// voice ID (V:) / '*' (K:/V:*)
			a) {	// array of items
	if (a.length == 0)
		return
	if (!info.V)
		info.V = {}
	if (info.V[vid])
		Array.prototype.push.apply(info.V[vid], a)
	else
		info.V[vid] = a
}

// K: key signature
// return the key and the voice/clef parameters
function new_key(param) {
	var	i, clef, key_end, c, tmp,
		mode = 0,
		s = {
			type: KEY,
			k_delta: 0,
			dur:0
		}

	set_ref(s);

	// tonic
	i = 1
	switch (param[0]) {
	case 'A': s.k_sf = 3; break
	case 'B': s.k_sf = 5; break
	case 'C': s.k_sf = 0; break
	case 'D': s.k_sf = 2; break
	case 'E': s.k_sf = 4; break
	case 'F': s.k_sf = -1; break
	case 'G': s.k_sf = 1; break
	case 'H':				// bagpipe
		switch (param[1]) {
		case 'P':
		case 'p':
			s.k_bagpipe = param[1];
			s.k_sf = param[1] == 'P' ? 0 : 2;
			i++
			break
		default:
			syntax(1, "Unknown bagpipe-like key")
			break
		}
		break
	case 'P':
		s.k_drum = true;
		key_end = true
		break
	case 'n':				// none
		if (param.indexOf("none") == 0) {
			s.k_sf = 0;
			s.k_none = true;
			i = 4
		}
		// fall thru
	default:
		key_end = true
		break
	}

	if (!key_end) {
		switch (param[i]) {
		case '#': s.k_sf += 7; i++; break
		case 'b': s.k_sf -= 7; i++; break
		}
		param = param.slice(i).trim()
		switch (param.slice(0, 3).toLowerCase()) {
		default:
			if (param[0] != 'm'
			 || (param[1] != ' ' && param[1] != '\t'
			  && param[1] != '\n')) {
				key_end = true
				break
			}
			// fall thru ('m')
		case "aeo":
		case "m":
		case "min": s.k_sf -= 3;
			mode = 5
			break
		case "dor": s.k_sf -= 2;
			mode = 1
			break
		case "ion":
		case "maj": break
		case "loc": s.k_sf -= 5;
			mode = 6
			break
		case "lyd": s.k_sf += 1;
			mode = 3
			break
		case "mix": s.k_sf -= 1;
			mode = 4
			break
		case "phr": s.k_sf -= 4;
			mode = 2
			break
		}
		if (!key_end)
			param = param.replace(/\w+\s*/, '')

		// [exp] accidentals
		if (param.indexOf("exp ") == 0) {
			param = param.replace(/\w+\s*/, '')
			if (!param)
				syntax(1, "No accidental after 'exp'");
			s.k_exp = true
		}
		c = param[0]
		if (c == '^' || c == '_' || c == '=') {
			s.k_a_acc = [];
			tmp = new scanBuf();
			tmp.buffer = param
			do {
				var note = parse_acc_pit(tmp)
				if (!note)
					return [s, null]
				s.k_a_acc.push(note);
				c = param[tmp.index]
				while (c == ' ')
					c = param[++tmp.index]
			} while (c == '^' || c == '_' || c == '=');
			param = param.slice(tmp.index)
		} else if (s.k_exp && param.indexOf("none") == 0) {
			s.k_sf = 0;
			param = param.replace(/\w+\s*/, '')
		}
	}

	s.k_delta = cgd2cde[(s.k_sf + 7) % 7];
	s.k_mode = mode

	return [s, info_split(param, 0)]
}

// M: meter
function new_meter(text) {
	var	s = {
			type: METER,
			dur: 0,
			a_meter: []
		},
		meter = {},
		val, v,
		m1 = 0, m2,
		i = 0, j,
		wmeasure,
		p = text,
		in_parenth;

	set_ref(s)

	if (p.indexOf("none") == 0) {
		i = 4;				/* no meter */
		wmeasure = 1;	// simplify measure numbering and MREST conversion
	} else {
		wmeasure = 0
		while (i < text.length) {
			if (p[i] == '=')
				break
			switch (p[i]) {
			case 'C':
				meter.top = p[i++]
				if (p[i] == '|')
					meter.top += p[i++];
				m1 = 4;
				m2 = 4
				break
			case 'c':
			case 'o':
				m1 = p[i] == 'c' ? 4 : 3;
				m2 = 4;
				meter.top = p[i++]
				if (p[i] == '.')
					meter.top += p[i++]
				break
			case '(':
				if (p[i + 1] == '(') {	/* "M:5/4 ((2+3)/4)" */
					in_parenth = true;
					meter.top = p[i++];
					s.a_meter.push(meter);
					meter = {}
				}
				j = i + 1
				while (j < text.length) {
					if (p[j] == ')' || p[j] == '/')
						break
					j++
				}
				if (p[j] == ')' && p[j + 1] == '/') {	/* "M:5/4 (2+3)/4" */
					i++		/* remove the parenthesis */
					continue
				}			/* "M:5 (2+3)" */
				/* fall thru */
			case ')':
				in_parenth = p[i] == '(';
				meter.top = p[i++];
				s.a_meter.push(meter);
				meter = {}
				continue
			default:
				if (p[i] <= '0' || p[i] > '9') {
					syntax(1, "Bad char '$1' in M:", p[i])
					return
				}
				m2 = 2;			/* default when no bottom value */
				meter.top = p[i++]
				for (;;) {
					while (p[i] >= '0' && p[i] <= '9')
						meter.top += p[i++]
					if (p[i] == ')') {
						if (p[i + 1] != '/')
							break
						i++
					}
					if (p[i] == '/') {
						i++;
						if (p[i] <= '0' || p[i] > '9') {
							syntax(1, "Bad char '$1' in M:", p[i])
							return
						}
						meter.bot = p[i++]
						while (p[i] >= '0' && p[i] <= '9')
							meter.bot += p[i++]
						break
					}
					if (p[i] != ' ' && p[i] != '+')
						break
					if (i >= text.length
					 || p[i + 1] == '(')	/* "M:5 (2/4+3/4)" */
						break
					meter.top += p[i++]
				}
				m1 = parseInt(meter.top)
				break
			}
			if (!in_parenth) {
				if (meter.bot)
					m2 = parseInt(meter.bot);
				wmeasure += m1 * BASE_LEN / m2
			}
			s.a_meter.push(meter);
			meter = {}
			while (p[i] == ' ')
				i++
			if (p[i] == '+') {
				meter.top = p[i++];
				s.a_meter.push(meter);
				meter = {}
			}
		}
	}
	if (p[i] == '=') {
		val = p.substring(++i).match(/^(\d+)\/(\d+)$/)
		if (!val) {
			syntax(1, "Bad duration '$1' in M:", p.substring(i))
			return
		}
		wmeasure = BASE_LEN * val[1] / val[2]
	}
	s.wmeasure = wmeasure

	if (parse.state != 3) {
		info.M = text;
		glovar.meter = s
		if (parse.state >= 1) {

			/* in the tune header, change the unit note length */
			if (!glovar.ulen) {
				if (wmeasure <= 1
				 || wmeasure >= BASE_LEN * 3 / 4)
					glovar.ulen = BASE_LEN / 8
				else
					glovar.ulen = BASE_LEN / 16
			}
			for (v = 0; v < voice_tb.length; v++) {
				voice_tb[v].meter = s;
				voice_tb[v].wmeasure = wmeasure
			}
		}
	} else {
		curvoice.wmeasure = wmeasure
		if (is_voice_sig()) {
			curvoice.meter = s;
			reset_gen()
		} else {
			sym_link(s)
		}
	}
}

/* Q: tempo */
function new_tempo(text) {
	var	i = 0, j, c, nd, tmp,
		s = {
			type: TEMPO,
			dur: 0
		}

	set_ref(s)

	if (cfmt.writefields.indexOf('Q') < 0)
		s.del = true			// don't display

	/* string before */
	if (text[0] == '"') {
		i = text.indexOf('"', 1)
		if (i < 0) {
			syntax(1, "Unterminated string in Q:")
			return
		}
		s.tempo_str1 = text.slice(1, i);
		i++
		while (text[i] == ' ')
			i++
	}

	/* beat */
	tmp = new scanBuf();
	tmp.buffer = text;
	tmp.index = i
	while (1) {
//		c = tmp.char()
		c = text[tmp.index]
		if (c == undefined || c <= '0' || c > '9')
			break
		nd = parse_dur(tmp)
		if (!s.tempo_notes)
			s.tempo_notes = []
		s.tempo_notes.push(BASE_LEN * nd[0] / nd[1])
		while (1) {
//			c = tmp.char()
			c = text[tmp.index]
			if (c != ' ')
				break
			tmp.index++
		}
	}

	/* tempo value */
	if (c == '=') {
		c = text[++tmp.index]
		while (c == ' ')
			c = text[++tmp.index];
		i = tmp.index
		if (c == 'c' && text[i + 1] == 'a'
		 && text[i + 2] == '.' && text[i + 3] == ' ') {
			s.tempo_ca = 'ca. ';
			tmp.index += 4;
//			c = text[tmp.index]
		}
		if (text[tmp.index + 1] != '/') {
			s.tempo = tmp.get_int()
		} else {
			nd = parse_dur(tmp);
			s.new_beat = BASE_LEN * nd[0] / nd[1]
		}
		c = text[tmp.index]
		while (c == ' ')
			c = text[++tmp.index]
	}

	/* string after */
	if (c == '"') {
		tmp.index++;
		i = text.indexOf('"', tmp.index + 1)
		if (i < 0) {
			syntax(1, "Unterminated string in Q:")
			return
		}
		s.tempo_str2 = text.slice(tmp.index, i)
	}

	if (parse.state != 3) {
		if (parse.state == 1) {			// tune header
			info.Q = text;
			glovar.tempo = s
			return
		}
		goto_tune()
	}
	if (curvoice.v == par_sy.top_voice) {	/* tempo only for first voice */
		sym_link(s)
		if (glovar.tempo && curvoice.time == 0)
			glovar.tempo.del = true
	}
}

// treat the information fields which may embedded
function do_info(info_type, text) {
	var s, d1, d2, a, vid

	switch (info_type) {

	// info fields in any state
	case 'I':
		do_pscom(text)
		break
	case 'L':
//fixme: ??
		if (parse.state == 2)
			goto_tune();
		a = text.match(/^1\/(\d+)(=(\d+)\/(\d+))?$/)
		if (a) {
			d1 = Number(a[1])
			if (!d1 || (d1 & (d1 - 1)) != 0)
				break
			d1 = BASE_LEN / d1
			if (a[2]) {
				d2 = Number(a[4])
				if (!d2 || (d2 & (d2 - 1)) != 0) {
					d2 = 0
					break
				}
				d2 = Number(a[3]) / d2 * BASE_LEN
			} else {
				d2 = d1
			}
		} else if (text == "auto") {
			d1 = d2 = -1
		}
		if (!d2) {
			syntax(1, "Bad L: value")
			break
		}
		if (parse.state < 2) {
			glovar.ulen = d1
		} else {
			curvoice.ulen = d1;
			curvoice.dur_fact = d2 / d1
		}
		break
	case 'M':
		new_meter(text)
		break
	case 'U':
		set_user(text)
		break

	// fields in tune header or tune body
	case 'P':
		if (parse.state == 0)
			break
		if (parse.state == 1) {
			info.P = text
			break
		}
		if (parse.state == 2)
			goto_tune()
		if (cfmt.writefields.indexOf(info_type) < 0)
			break
		s = {
			type: PART,
			text: text,
			dur: 0
		}

		/*
		 * If not in the main voice, then,
		 * if the voices are synchronized and no P: yet in the main voice,
		 * the misplaced P: goes into the main voice.
		 */
		var p_voice = voice_tb[par_sy.top_voice]
		if (curvoice.v != p_voice.v) {
			if (curvoice.time != p_voice.time)
				break
			if (p_voice.last_sym && p_voice.last_sym.type == PART)
				break		// already a P:
			var voice_sav = curvoice;
			curvoice = p_voice;
			sym_link(s);
			curvoice = voice_sav
		} else {
			sym_link(s)
		}
		break
	case 'Q':
		if (parse.state == 0)
			break
		new_tempo(text)
		break
	case 'V':
		get_voice(text)
		break

	// key signature at end of tune header on in tune body
	case 'K':
		if (parse.state == 0)
			break
		get_key(text)
		break

	// info in any state
	case 'N':
	case 'R':
		if (!info[info_type])
			info[info_type] = text
		else
			info[info_type] += '\n' + text
		break
	case 'r':
		if (!user.keep_remark
		 || parse.state != 3)
			break
		s = {
			type: REMARK,
			text: text,
			dur: 0
		}
		sym_link(s)
		break
	default:
		syntax(0, "'$1:' line ignored", info_type)
		break
	}
}

// music line parsing functions

/* -- adjust the duration and time of symbols in a measure when L:auto -- */
function adjust_dur(s) {
	var s2, time, auto_time, i, res;

	/* search the start of the measure */
	s2 = curvoice.last_sym
	if (!s2)
		return;

	/* the bar time is correct if there are multi-rests */
	if (s2.type == MREST
	 || s2.type == BAR)			/* in second voice */
		return
	while (s2.type != BAR && s2.prev)
		s2 = s2.prev;
	time = s2.time;
	auto_time = curvoice.time - time

	/* remove the invisible rest at start of tune */
	if (time == 0) {
		while (s2 && !s2.dur)
			s2 = s2.next
		if (s2 && s2.type == REST
		 && s2.invis) {
			time += s2.dur * curvoice.wmeasure / auto_time
			if (s2.prev)
				s2.prev.next = s2.next
			else
				curvoice.sym = s2.next
			if (s2.next)
				s2.next.prev = s2.prev;
			s2 = s2.next
		}
	}
	if (curvoice.wmeasure == auto_time)
		return				/* already good duration */

	for ( ; s2; s2 = s2.next) {
		s2.time = time
		if (!s2.dur || s2.grace)
			continue
		s2.dur = s2.dur * curvoice.wmeasure / auto_time;
		s2.dur_orig = s2.dur_orig * curvoice.wmeasure / auto_time;
		time += s2.dur
		if (s2.type != NOTE && s2.type != REST)
			continue
		for (i = 0; i <= s2.nhd; i++)
			s2.notes[i].dur = s2.notes[i].dur
					 * curvoice.wmeasure / auto_time;
		res = identify_note(s2, s2.dur_orig);
		s2.head = res[0];
		s2.dots = res[1];
		s2.nflags = res[2]
		if (s2.nflags <= -2)
			s2.stemless = true
		else
			delete s2.stemless
	}
	curvoice.time = s.time = time
}

/* -- parse a bar -- */
function new_bar() {
	var	s2, c, bar_type,
		line = parse.line,
		s = {
			type: BAR,
			fname: parse.fname,
			istart: parse.bol + line.index,
			dur: 0,
			multi: 0		// needed for decorations
		}

	if (vover && vover.bar)			// end of voice overlay
		get_vover('|')
	if (glovar.new_nbar) {			// %%setbarnb
		s.bar_num = glovar.new_nbar;
		glovar.new_nbar = 0
	}
	bar_type = line.char()
	while (1) {
		c = line.next_char()
		switch (c) {
		case '|':
		case '[':
		case ']':
		case ':':
			bar_type += c
			continue
		}
		break
	}
	if (bar_type[0] == ':') {
		if (bar_type.length == 1) {	// ":" alone
			bar_type = '|';
			s.bar_dotted = true
		} else {
			s.rbstop = 2		// right repeat with end
		}
	}

	// set the guitar chord and the decorations
	if (a_gch)
		gch_build(s)
	if (a_dcn) {
		deco_cnv(a_dcn, s);
		a_dcn = null
	}

	/* if the last element is '[', it may start
	 * a chord or an embedded header */
	switch (bar_type.slice(-1)) {
	case '[':
		if (/[0-9" ]/.test(c))		// "
			break
		bar_type = bar_type.slice(0, -1);
		line.index--;
		c = '['
		break
	case ':':				// left repeat
		s.rbstop = 2			// with bracket end
		break
	}

	// check if repeat bar
	if (c > '0' && c <= '9') {
		if (bar_type.slice(-1) == '[')
			bar_type = bar_type.slice(0, -1);
		s.text = c
		while (1) {
			c = line.next_char()
			if ("0123456789,.-".indexOf(c) < 0)
				break
			s.text += c
		}
		s.rbstop = 2;
		s.rbstart = 2
	} else if (c == '"' && bar_type.slice(-1) == '[') {
		bar_type = bar_type.slice(0, -1);
		s.text = ""
		while (1) {
			c = line.next_char()
			if (!c) {
				syntax(1, "No end of repeat string")
				return
			}
			if (c == '"') {
				line.index++
				break
			}
			if (c == '\\') {
				s.text += c;
				c = line.next_char()
			}
			s.text += c
		}
		s.text = cnv_escape(s.text);
		s.rbstop = 2;
		s.rbstart = 2
	}

	// ']' as the first character indicates a repeat bar stop
	if (bar_type[0] == ']') {
		s.rbstop = 2			// with end
		if (bar_type.length != 1)
			bar_type = bar_type.slice(1)
		else
			s.invis = true
	}

	s.iend = parse.bol + line.index

	if (s.rbstart
	 && curvoice.norepbra
	 && !curvoice.second)
		s.norepbra = true

	if (curvoice.ulen < 0)			// L:auto
		adjust_dur(s);

	s2 = curvoice.last_sym
	if (s2 && s2.type == SPACE) {
		s2.time--		// keep the space at the right place
	} else if (s2 && s2.type == BAR) {
//fixme: why these next lines?
//		&& !s2.a_gch && !s2.a_dd
//		&& !s.a_gch && !s.a_dd) {

		/* remove the invisible repeat bars when no shift is needed */
		if (bar_type == "["
		 && !s2.text
		 && (curvoice.st == 0
		  || (par_sy.staves[curvoice.st - 1].flags & STOP_BAR)
		  || s.norepbra)) {
			if (s.text)
				s2.text = s.text
			if (s.a_gch)
				s2.a_gch = s.a_gch
			if (s.norepbra)
				s2.norepbra = s.norepbra
			if (s.rbstart)
				s2.rbstart = s.rbstart
			if (s.rbstop)
				s2.rbstop = s.rbstop
//--fixme: pb when on next line and empty staff above
			return
		}

		/* merge back-to-back repeat bars */
		if (bar_type == "|:") {
			if (s2.bar_type == ":|") {
				s2.bar_type = "::";
				s2.rbstop = 2
				return
			}
			if (s2.bar_type == "||") {
				s2.bar_type = "||:";
				s2.rbstop = 2
				return
			}
		}
	}

	/* set some flags */
	switch (bar_type) {
	case "[":
		s.rbstop = 2
	case "[]":
	case "[|]":
		s.invis = true;
		bar_type = "[]"
		break
	case ":|:":
	case ":||:":
		bar_type = "::"
		break
	case "||":
		if (!cfmt.rbdbstop)
			break
	case "[|":
	case "|]":
		s.rbstop = 2
		break
	}
	s.bar_type = bar_type
	if (!curvoice.lyric_restart)
		curvoice.lyric_restart = s
	if (!curvoice.sym_restart)
		curvoice.sym_restart = s

	/* the bar must appear before a key signature */
	if (s2 && s2.type == KEY
	 && (!s2.prev || s2.prev.type != BAR)) {
		curvoice.last_sym = s2.prev
		if (!s2.prev)
			curvoice.sym = s2.prev;	// null
		sym_link(s);
		s.next = s2;
		s2.prev = s;
		curvoice.last_sym = s2
	} else {
		sym_link(s)
	}
	s.st = curvoice.st			/* original staff */

	/* if repeat bar and shift, add a repeat bar */
	if (s.rbstart
	 && !curvoice.norepbra
	 && curvoice.st > 0
	 && !(par_sy.staves[curvoice.st - 1].flags & STOP_BAR)) {
		s2 = {
			type: BAR,
			fname: s.fname,
			istart: s.istart,
			iend: s.iend,
			bar_type: "[",
			multi: 0,
			invis: true,
			text: s.text,
			rbstart: 2
		}
		sym_link(s2);
		s2.st = curvoice.st
		delete s.text;
		s.rbstart = 0
	}
}

// parse %%staves / %%score
// return an array of [vid, flags] / null
function parse_staves(p) {
	var	v, vid,
		a_vf = [],
		err = false,
		flags = 0,
		brace = 0,
		bracket = 0,
		parenth = 0,
		flags_st = 0,
		i = 0

	/* parse the voices */
	while (i < p.length) {
		switch (p[i]) {
		case ' ':
		case '\t':
			break
		case '[':
			if (parenth || brace + bracket >= 2) {
				syntax(1, errs.misplaced, '[');
				err = true
				break
			}
			flags |= brace + bracket == 0 ? OPEN_BRACKET : OPEN_BRACKET2;
			bracket++;
			flags_st <<= 8;
			flags_st |= OPEN_BRACKET
			break
		case '{':
			if (parenth || brace || bracket >= 2) {
				syntax(1, errs.misplaced, '{');
				err = true
				break
			}
			flags |= !bracket ? OPEN_BRACE : OPEN_BRACE2;
			brace++;
			flags_st <<= 8;
			flags_st |= OPEN_BRACE
			break
		case '(':
			if (parenth) {
				syntax(1, errs.misplaced, '(');
				err = true
				break
			}
			flags |= OPEN_PARENTH;
			parenth++;
			flags_st <<= 8;
			flags_st |= OPEN_PARENTH
			break
		case '*':
			if (brace && !parenth && !(flags & (OPEN_BRACE | OPEN_BRACE2)))
				flags |= FL_VOICE
			break
		case '+':
			flags |= MASTER_VOICE
			break
		default:
			if (!/\w/.test(p[i])) {
				syntax(1, "Bad voice ID in %%staves");
				err = true
				break
			}

			/* get / create the voice in the voice table */
			vid = ""
			while (i < p.length) {
				if (" \t()[]{}|*".indexOf(p[i]) >= 0)
					break
				vid += p[i++]
			}
			for ( ; i < p.length; i++) {
				switch (p[i]) {
				case ' ':
				case '\t':
					continue
				case ']':
					if (!(flags_st & OPEN_BRACKET)) {
						syntax(1, errs.misplaced, ']');
						err = true
						break
					}
					bracket--;
					flags |= brace + bracket == 0 ?
							CLOSE_BRACKET :
							CLOSE_BRACKET2;
					flags_st >>= 8
					continue
				case '}':
					if (!(flags_st & OPEN_BRACE)) {
						syntax(1, errs.misplaced, '}');
						err = true
						break
					}
					brace--;
					flags |= !bracket ?
							CLOSE_BRACE :
							CLOSE_BRACE2;
					flags &= ~FL_VOICE;
					flags_st >>= 8
					continue
				case ')':
					if (!(flags_st & OPEN_PARENTH)) {
						syntax(1, errs.misplaced, ')');
						err = true
						break
					}
					parenth--;
					flags |= CLOSE_PARENTH;
					flags_st >>= 8
					continue
				case '|':
					flags |= STOP_BAR
					continue
				}
				break
			}
			a_vf.push([vid, flags]);
			flags = 0
			continue
		}
		i++
	}
	if (flags_st != 0) {
		syntax(1, "'}', ')' or ']' missing in %%staves");
		err = true
	}
	if (err || a_vf.length == 0)
		return //null
	return a_vf
}

// split an info string
function info_split(text) {
	if (!text)
		return []
    var	a = text.match(/(".+?"|.+?)(\s+|=|$)/g)
	if (!a) {
		syntax(1, "Unterminated string")
		return []
	}
	for (var i = 0; i < a.length; i++)
		a[i] = a[i].trim()
	return a
}

/* -- get head type, dots, flags of note/rest for a duration -- */
function identify_note(s, dur) {
	var head, dots, flags

	if (dur % 12 != 0)
		syntax(1, "Invalid note duration $1", dur);
	dur /= 12			/* see BASE_LEN for values */
	if (dur == 0)
		syntax(1, "Note too short")
	for (flags = 5; dur != 0; dur >>= 1, flags--) {
		if (dur & 1)
			break
	}
	dur >>= 1
	switch (dur) {
	case 0: dots = 0; break
	case 1: dots = 1; break
	case 3: dots = 2; break
//	case 7: dots = 3; break
	default:
		dots = 3
		break
	}
	flags -= dots
//--fixme: is 'head' useful?
	if (flags >= 0) {
		head = FULL
	} else switch (flags) {
	default:
		syntax(1, "Note too long");
		flags = -4
		/* fall thru */
	case -4:
		head = SQUARE
		break
	case -3:
		head = cfmt.squarebreve ? SQUARE : OVALBARS
		break
	case -2:
		head = OVAL
		break
	case -1:
		head = EMPTY
		break
	}
	return [head, dots, flags]
}

// parse a duration and return [numerator, denominator]
// 'line' is not always 'parse.line'
var reg_dur = /(\d*)(\/*)(\d*)/g		/* (stop comment) */

function parse_dur(line) {
	var res, num, den;

	reg_dur.lastIndex = line.index;
	res = reg_dur.exec(line.buffer)
	if (!res[0])
		return [1, 1];
	num = res[1] || 1;
	den = res[3] || 1
	if (!res[3])
		den *= 1 << res[2].length;
	line.index = reg_dur.lastIndex
	return [num, den]
}

// parse the note accidental and pitch
function parse_acc_pit(line) {
	var	note, acc, micro_n, micro_d, pit, nd,
		c = line.char()

	// optional accidental
	switch (c) {
	case '^':
		c = line.next_char()
		if (c == '^') {
			acc = 2;
			c = line.next_char()
		} else {
			acc = 1
		}
		break
	case '=':
		acc = 3;
		c = line.next_char()
		break
	case '_':
		c = line.next_char()
		if (c == '_') {
			acc = -2;
			c = line.next_char()
		} else {
			acc = -1
		}
		break
	}

	/* look for microtone value */
	if (acc && acc != 3 && (c >= '1' && c <= '9')
	 || c == '/') {				// compatibility
		nd = parse_dur(line);
		micro_n = nd[0];
		micro_d = nd[1]
		if (micro_d == 1)
			micro_d = curvoice ? curvoice.uscale : 1
		else
			micro_d *= 2;	// 1/2 tone fraction -> tone fraction
		c = line.char()
	}

	/* get the pitch */
	pit = ntb.indexOf(c) + 16;
	c = line.next_char()
	if (pit < 16) {
		syntax(1, "'$1' is not a note", line.buffer[line.index - 1])
		return //undefined
	}

	// octave
	while (c == "'") {
		pit += 7;
		c = line.next_char()
	}
	while (c == ',') {
		pit -= 7;
		c = line.next_char()
	}
	note = {
		pit: pit,
		apit: pit,
		shhd: 0,
		shac: 0,
		ti1: 0
	}
	if (acc) {
		note.acc = acc
		if (micro_n) {
			note.micro_n = micro_n;
			note.micro_d = micro_d
		}
	}
	return note
}

/* set the mapping of a note */
function set_map(note) {
	var	bn, an, nn, i,
		map = maps[curvoice.map]	// never null

	bn = 'abcdefg'[(note.pit + 77) % 7]
	if (note.acc)
		an = ['__', '_', '', '^', '^^', '='][note.acc + 2]
	else
		an = ''
//fixme: treat microtone
	nn = an + bn
	for (i = note.pit; i >= 28; i -= 7)
		nn += "'"
	for (i = note.pit; i < 21; i += 7)
		nn += ",";

	if (!map[nn]) {
		nn = 'octave,' + an + bn		// octave
		if (!map[nn]) {
			nn = 'key,' +			// 'key,'
				'abcdefg'[(note.pit + 77 -
						curvoice.ckey.k_delta) % 7]
			if (!map[nn]) {
				nn = 'all'		// 'all'
				if (!map[nn])
					return
			}
		}
	}
	note.map = map[nn]
	if (note.map[1]) {
		note.apit = note.pit = note.map[1].pit;	// print
		note.acc = note.map[1].acc
	}
}

/* -- parse note or rest with pitch and length -- */
// 'line' is not always 'parse.line'
function parse_basic_note(line, ulen) {
	var	nd,
		note = parse_acc_pit(line)

	if (!note)
		return //null

	// duration
	if (line.char() == '0') {		// compatibility
		parse.stemless = true;
		line.index++
	}
	nd = parse_dur(line);
	note.dur = ulen * nd[0] / nd[1]
	return note
}

function parse_vpos() {
	var	c,
		line = parse.line,
		ti1 = 0

	if (line.buffer[line.index - 1] == '.' && !a_dcn)
		ti1 = SL_DOTTED
	switch (line.next_char()) {
	case "'":
		line.index++
		return ti1 + SL_ABOVE
	case ",":
		line.index++
		return ti1 + SL_BELOW
	}
	return ti1 + SL_AUTO
}

var	cde2fcg = new Int8Array([0, 2, 4, -1, 1, 3, 5]),
	cgd2cde = new Int8Array([0, 4, 1, 5, 2, 6, 3]),
	acc2 = new Int8Array([-2, -1, 3, 1, 2])

/* transpose a note / chord */
function note_transp(s) {
	var	i, j, n, d, a, acc, i1, i3, i4, note,
		m = s.nhd,
		sf_old = curvoice.okey.k_sf,
		i2 = curvoice.ckey.k_sf - sf_old,
		dp = cgd2cde[(i2 + 4 * 7) % 7],
		t = curvoice.vtransp

	if (t < 0 && dp != 0)
		dp -= 7;
	dp += ((t / 3 / 12) | 0) * 7
	for (i = 0; i <= m; i++) {
		note = s.notes[i];

		// pitch
		n = note.pit;
		note.pit += dp;
		note.apit = note.pit;

		// accidental
		i1 = cde2fcg[(n + 5 + 16 * 7) % 7];	/* fcgdaeb */
		a = note.acc
		if (!a) {
			if (!curvoice.okey.a_acc) {
				if (sf_old > 0) {
					if (i1 < sf_old - 1)
						a = 1	// sharp
				} else if (sf_old < 0) {
					if (i1 >= sf_old + 6)
						a = -1	// flat
				}
			} else {
				for (j = 0; j < curvoice.okey.a_acc.length; j++) {
					acc = curvoice.okey.a_acc[j]
					if ((n + 16 * 7 - acc.pit) % 7 == 0) {
						a = acc.acc
						break
					}
				}
			}
		}
		i3 = i1 + i2
		if (a && a != 3)				// ! natural
			i3 += a * 7;

		i1 = ((((i3 + 1 + 21) / 7) | 0) + 2 - 3 + 32 * 5) % 5;
		a = acc2[i1]
		if (note.acc) {
			;
		} else if (curvoice.ckey.k_none) {
			if (a == 3		// natural
			 || acc_same_pitch(note.pit))
				continue
		} else if (curvoice.ckey.a_acc) {	/* acc list */
			i4 = cgd2cde[(i3 + 16 * 7) % 7]
			for (j = 0; j < curvoice.ckey.a_acc.length; j++) {
				if ((i4 + 16 * 7 - curvoice.ckey.a_acc[j].pits) % 7
							== 0)
					break
			}
			if (j < curvoice.ckey.a_acc.length)
				continue
		} else {
			continue
		}
		i1 = note.acc;
		d = note.micro_d
		if (d				/* microtone */
		 && i1 != a) {			/* different accidental type */
			n = note.micro_n
//fixme: double sharps/flats ?*/
//fixme: does not work in all cases (tied notes, previous accidental)
			switch (a) {
			case 3:			// natural
				if (n > d / 2) {
					n -= d / 2;
					note.micro_n = n;
					a = i1
				} else {
					a = -i1
				}
				break
			case 2:			// double sharp
				if (n > d / 2) {
					note.pit += 1;
					note.apit = note.pit;
					n -= d / 2
				} else {
					n += d / 2
				}
				a = i1;
				note.micro_n = n
				break
			case -2:		// double flat
				if (n >= d / 2) {
					note.pit -= 1;
					note.apit = note.pit;
					n -= d / 2
				} else {
					n += d / 2
				}
				a = i1;
				note.micro_n = n
				break
			}
		}
		note.acc = a
	}
}

/* sort the notes of the chord by pitch (lowest first) */
function sort_pitch(s) {
	s.notes = s.notes.sort(function(n1, n2) {
			return n1.pit - n2.pit
		})
}
function new_note(grace, tp_fact) {
	var	note, s, in_chord, c, dcn, type,
		i, n, s2, nd, res, num, dur,
		sl1 = 0,
		line = parse.line,
		a_dcn_sav = a_dcn;	// save parsed decoration names

	a_dcn = null;
	parse.stemless = false;
	s = {
		type: NOTE,
		fname: parse.fname,
		stem: 0,
		multi: 0,
		nhd: 0,
		xmx: 0
	}
	s.istart = parse.bol + line.index

	if (curvoice.color)
		s.color = curvoice.color

	if (grace) {
		s.grace = true
	} else {
		if (a_gch)
			gch_build(s)
		if (parse.repeat_n) {
			s.repeat_n = parse.repeat_n;
			s.repeat_k = parse.repeat_k;
			parse.repeat_n = 0
		}
	}
	c = line.char()
	switch (c) {
	case 'X':
		s.invis = true
	case 'Z':
		s.type = MREST;
		c = line.next_char()
		s.nmes = (c > '0' && c <= '9') ? line.get_int() : 1;
		s.dur = curvoice.wmeasure * s.nmes

		// ignore if in second voice
		if (curvoice.second) {
			curvoice.time += s.dur
			return null
		}
		break
	case 'y':
		s.type = SPACE;
		s.invis = true;
		s.dur = 0;
		c = line.next_char()
		if (c >= '0' && c <= '9')
			s.width = line.get_int()
		else
			s.width = 10
		break
	case 'x':
		s.invis = true
	case 'z':
		s.type = REST;
		line.index++;
		nd = parse_dur(line);
		s.dur_orig = ((curvoice.ulen < 0) ?
					15120 :	// 2*2*2*2*3*3*3*5*7
					curvoice.ulen) * nd[0] / nd[1];
		s.dur = s.dur_orig * curvoice.dur_fact;
		s.notes = [{
			pit: 18,
			dur: s.dur_orig
		}]
		break
	case '[':			// chord
		in_chord = true;
		c = line.next_char()
		// fall thru
	default:			// accidental, chord, note
		if (curvoice.uscale)
			s.uscale = curvoice.uscale;
		s.notes = []

		// loop on the chord
		while (1) {

			// when in chord, get the slurs and decorations
			if (in_chord) {
				while (1) {
					if (!c)
						break
					i = c.charCodeAt(0);
					if (i >= 128) {
						syntax(1, errs.not_ascii)
						return null
					}
					type = char_tb[i]
					switch (type[0]) {
					case '(':
						sl1 <<= 4;
						sl1 += parse_vpos();
						c = line.char()
						continue
					case '!':
						if (!a_dcn)
							a_dcn = []
						if (type.length > 1) {
							a_dcn.push(type.slice(1, -1))
						} else {
							dcn = ""
							while (1) {
								c = line.next_char()
								if (!c) {
									syntax(1, "No end of decoration")
									return //null
								}
								if (c == '!')
									break
								dcn += c
							}
							a_dcn.push(dcn)
						}
						c = line.next_char()
						continue
					}
					break
				}
			}
			note = parse_basic_note(line,
					s.grace ? BASE_LEN / 4 :
					curvoice.ulen < 0 ?
						15120 :	// 2*2*2*2*3*3*3*5*7
						curvoice.ulen)
			if (!note)
				return //null

			// transpose
			if (curvoice.octave)
				note.apit = note.pit += curvoice.octave * 7
			if (curvoice.ottava)
				note.pit += curvoice.ottava
			if (sl1) {
				note.sl1 = sl1
				if (s.sl1)
					s.sl1++
				else
					s.sl1 = 1;
				sl1 = 0
			}
			if (a_dcn) {
				note.a_dcn = a_dcn;
				a_dcn = null
			}
			s.notes.push(note)
			if (!in_chord)
				break

			// in chord: get the ending slurs and the ties
			c = line.char()
			while (1) {
				switch (c) {
				case ')':
					if (note.sl2)
						note.sl2++
					else
						note.sl2 = 1
					if (s.sl2)
						s.sl2++
					else
						s.sl2 = 1;
					c = line.next_char()
					continue
				case '-':
					note.ti1 = parse_vpos();
					s.ti1 = true;
					c = line.char()
					continue
				case '.':
					c = line.next_char()
					if (c != '-') {
						syntax(1, "Misplaced dot")
						break
					}
					continue
				}
				break
			}
			if (c == ']') {
				line.index++;

				// adjust the chord duration
				nd = parse_dur(line);
				s.nhd = s.notes.length - 1
				for (i = 0; i <= s.nhd ; i++) {
					note = s.notes[i];
					note.dur = note.dur * nd[0] / nd[1]
				}
				break
			}
		}

		// the duration of the chord is the duration of the 1st note
		s.dur_orig = s.notes[0].dur;
		s.dur = s.notes[0].dur * curvoice.dur_fact
	}
	if (s.grace && s.type != NOTE) {
		syntax(1, "Not a note in grace note sequence")
		return //null
	}

	if (s.notes) {				// if note or rest
		if (!s.grace) {
			switch (curvoice.pos.stm) {
			case SL_ABOVE: s.stem = 1; break
			case SL_BELOW: s.stem = -1; break
			case SL_HIDDEN: s.stemless = true; break
			}

			// adjust the symbol duration
			s.dur *= tp_fact;
			num = curvoice.brk_rhythm
			if (num) {
				curvoice.brk_rhythm = 0;
				s2 = curvoice.last_note
				if (num > 0) {
					n = num * 2 - 1;
					s.dur = s.dur * n / num;
					s.dur_orig = s.dur_orig * n / num
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur =
							s.notes[i].dur * n / num;
					s2.dur /= num;
					s2.dur_orig /= num
					for (i = 0; i <= s2.nhd; i++)
						s2.notes[i].dur /= num
				} else {
					num = -num;
					n = num * 2 - 1;
					s.dur /= num;
					s.dur_orig /= num
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur /= num;
					s2.dur = s2.dur * n / num;
					s2.dur_orig = s2.dur_orig * n / num
					for (i = 0; i <= s2.nhd; i++)
						s2.notes[i].dur =
							s2.notes[i].dur * n / num
				}
				curvoice.time = s2.time + s2.dur;
				res = identify_note(s2, s2.dur_orig);
				s2.head = res[0];
				s2.dots = res[1];
				s2.nflags = res[2]
				if (s2.nflags <= -2)
					s2.stemless = true
				else
					delete s2.stemless

				// adjust the time of the grace notes, bars...
				for (s2 = s2.next; s2; s2 = s2.next)
					s2.time = curvoice.time
			}
		} else {		/* grace note - adjust its duration */
			var div = curvoice.key.k_bagpipe ? 8 : 4

			for (i = 0; i <= s.nhd; i++)
				s.notes[i].dur /= div;
			s.dur /= div;
			s.dur_orig /= div
			if (grace.stem)
				s.stem = grace.stem
		}

		// set the symbol parameters
		if (s.type == NOTE) {
			res = identify_note(s, s.dur_orig);
			s.head = res[0];
			s.dots = res[1];
			s.nflags = res[2]
			if (s.nflags <= -2)
				s.stemless = true
		} else {					// rest

			/* change the figure of whole measure rests */
//--fixme: does not work in sample.abc because broken rhythm on measure bar
			dur = s.dur_orig
			if (dur == curvoice.wmeasure) {
				if (dur < BASE_LEN * 2)
					dur = BASE_LEN
				else if (dur < BASE_LEN * 4)
					dur = BASE_LEN * 2
				else
					dur = BASE_LEN * 4
			}
			res = identify_note(s, dur);
			s.head = res[0];
			s.dots = res[1];
			s.nflags = res[2]
		}
		curvoice.last_note = s
	}

	sym_link(s)

	if (s.type == NOTE) {
		if (curvoice.vtransp)
			note_transp(s)
		if (curvoice.map
		 && maps[curvoice.map]) {
			for (i = 0; i <= s.nhd; i++)
				set_map(s.notes[i])
		}
	}

	if (cfmt.shiftunison)
		s.shiftunison = cfmt.shiftunison
	if (!grace) {
		if (!curvoice.lyric_restart)
			curvoice.lyric_restart = s
		if (!curvoice.sym_restart)
			curvoice.sym_restart = s
	}

	if (a_dcn_sav)
		deco_cnv(a_dcn_sav, s, s.prev)
	if (parse.stemless)
		s.stemless = true
	s.iend = parse.bol + line.index
	return s
}

// characters in the music line (ASCII only)
var nil = ["0"]
var char_tb = [
	nil, nil, nil, nil,		/* 00 - .. */
	nil, nil, nil, nil,
	nil, " ", "\n", nil,		/* . \t \n . */
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,
	nil, nil, nil, nil,		/* .. - 1f */
	" ", "!", '"', "i",		/* (sp) ! " # */
	"\n", nil, "&", nil,		/* $ % & ' */
	"(", ")", "i", nil,		/* ( ) * + */
	nil, "-", "!dot!", nil,		/* , - . / */
	nil, nil, nil, nil, 		/* 0 1 2 3 */
	nil, nil, nil, nil, 		/* 4 5 6 7 */
	nil, nil, "|", "i",		/* 8 9 : ; */
	"<", "n", "<", "i",		/* < = > ? */
	"i", "n", "n", "n",		/* @ A B C */
	"n", "n", "n", "n", 		/* D E F G */
	"!fermata!", "d", "d", "d",	/* H I J K */
	"!emphasis!", "!lowermordent!",
		"d", "!coda!",		/* L M N O */
	"!uppermordent!", "d",
		"d", "!segno!",		/* P Q R S */
	"!trill!", "d", "d", "d",	/* T U V W */
	"n", "d", "n", "[",		/* X Y Z [ */
	"\\","|", "n", "n",		/* \ ] ^ _ */
	"i", "n", "n", "n",	 	/* ` a b c */
	"n", "n", "n", "n",	 	/* d e f g */
	"d", "d", "d", "d",		/* h i j k */
	"d", "d", "d", "d",		/* l m n o */
	"d", "d", "d", "d",		/* p q r s */
	"d", "!upbow!",
		"!downbow!", "d",	/* t u v w */
	"n", "n", "n", "{",		/* x y z { */
	"|", "}", "!gmark!", nil,	/* | } ~ (del) */
]

function parse_music_line() {
	var	grace, last_note_sav, a_dcn_sav, no_eol, s,
		tp_a = [], tp,
		tpn = -1,
		tp_fact = 1,
		slur_start = 0,
		line = parse.line

	// check if a transposing macro matches a source sequence
	// if yes return the base note
	function check_mac(m) {
	    var	i, j, b

		for (i = 1, j = line.index + 1; i < m.length; i++, j++) {
			if (m[i] == line.buffer[j])
				continue
			if (m[i] != 'n')		// search the base note
				return //null
			b = ntb.indexOf(line.buffer[j])
			if (b < 0)
				return //null
			while (line.buffer[j + 1] == "'") {
				b += 7;
				j++
			}
			while (line.buffer[j + 1] == ',') {
				b -= 7;
				j++
			}
		}
		line.index = j
		return b
	}

	// expand a transposing macro
	function expand(m, b) {
	    var	c, d,
		r = "",				// result
		n = m.length

		for (i = 0; i < n; i++) {
			c = m[i]
			if (c >= 'h' && c <= 'z') {
				d = b + c.charCodeAt(0) - 'n'.charCodeAt(0)
				c = ""
				while (d < 0) {
					d += 7;
					c += ','
				}
				while (d > 14) {
					d -= 7;
					c += "'"
				}
				r += ntb[d] + c
			} else {
				r += c
			}
		}
		return r
	} // expand()

	// parse a macro
	function parse_mac(m, b) {
	    var	seq,
		line_sav = line,
		istart_sav = parse.istart;

		parse.line = line = new scanBuf();
		parse.istart += line_sav.index;
		line.buffer = b ? expand(m, b) : m;
		parse_seq(true);
		parse.line = line = line_sav;
		parse.istart = istart_sav
	}

	// parse a music sequence
	function parse_seq(in_mac) {
	    var	c, idx, type, k, s, dcn, i, n, text

		while (1) {
			c = line.char()
			if (!c)
				break

			// special case for '.' (dot)
			if (c == '.') {
				switch (line.buffer[line.index + 1]) {
				case '(':
				case '-':
				case '|':
					c = line.next_char()
					break
				}
			}

			idx = c.charCodeAt(0);
			if (idx >= 128) {
				syntax(1, errs.not_ascii);
				line.index++
				break
			}

			// check if start of a macro
			if (!in_mac && maci[idx]) {
				n = 0
				for (k in mac) {
					if (!mac.hasOwnProperty(k)
					 || k[0] != c)
						continue
					if (k.indexOf('n') < 0) {
						if (line.buffer.indexOf(k, line.index)
								!= line.index)
							continue
						line.index += k.length
					} else {
						n = check_mac(k)
						if (!n)
							continue
					}
					parse_mac(mac[k], n);
					n = 1
					break
				}
				if (n)
					continue
			}

			type = char_tb[idx]
			switch (type[0]) {
			case ' ':			// beam break
				s = curvoice.last_note
				if (s) {
					s.beam_end = true
					if (grace)
						grace.gr_shift = true
				}
				break
			case '\n':			// line break
				if (cfmt.barsperstaff)
					break
				if (par_sy.voices[curvoice.v].range == 0
				 && curvoice.last_sym)
					curvoice.last_sym.eoln = true
				break
			case '&':			// voice overlay
				if (grace) {
					syntax(1, errs.bad_char, c)
					break
				}
				c = line.next_char()
				if (c == ')') {
					get_vover(')')
					break
				}
				get_vover('&')
				continue
			case '(':			// slur start - tuplet - vover
				c = line.next_char()
				if (c > '0' && c <= '9') {	// tuplet
				    var	pplet = line.get_int(),
					qplet = qplet_tb[pplet],
					rplet = pplet,
					c = line.char()

					if (c == ':') {
						c = line.next_char()
						if (c > '0' && c <= '9') {
							qplet = line.get_int();
							c = line.char()
						}
						if (c == ':') {
							c = line.next_char()
							if (c > '0' && c <= '9') {
								rplet = line.get_int();
								c = line.char()
							} else {
								syntax(1, "Invalid 'r' in tuplet")
								continue
							}
						}
					}
					if (qplet == 0 || qplet == undefined)
						qplet = (curvoice.wmeasure % 9) == 0 ?
									3 : 2;
					tp = tp_a[++tpn]
					if (!tp)
						tp_a[tpn] = tp = {}
					tp.p = pplet;
					tp.q = qplet;
					tp.r = rplet;
					tp.f = cfmt.tuplets;
					tp.fact	= tp_fact * qplet / pplet;
					tp_fact = tp.fact
					continue
				}
				if (c == '&') {		// voice overlay start
					if (grace) {
						syntax(1, errs.bad_char, c)
						break
					}
					get_vover('(')
					break
				}
				slur_start <<= 4;
				line.index--;
				slur_start += parse_vpos()
				continue
			case ')':			// slur end
				if (curvoice.ignore)
					break
				s = curvoice.last_sym
				if (s) {
					switch (s.type) {
					case NOTE:
					case REST:
					case SPACE:
						break
					default:
						s = null
						break
					}
				}
				if (!s) {
					syntax(1, errs.bad_char, c)
					break
				}
				if (s.slur_end)
					s.slur_end++
				else
					s.slur_end = 1
				break
			case '!':			// start of decoration
				if (!a_dcn)
					a_dcn = []
				if (type.length > 1) {	// decoration letter
					dcn = type.slice(1, -1)
				} else {
					dcn = "";
					i = line.index		// in case no deco end
					while (1) {
						c = line.next_char()
						if (!c)
							break
						if (c == '!')
							break
						dcn += c
					}
					if (!c) {
						line.index = i;
						syntax(1, "No end of decoration")
						break
					}
				}
				if (ottava[dcn])
					set_ottava(dcn)
				a_dcn.push(dcn)
				break
			case '"':
				parse_gchord(type)
				break
			case '-':
			    var tie_pos = 0

				if (!curvoice.last_note
				 || curvoice.last_note.type != NOTE) {
					syntax(1, "No note before '-'")
					break
				}
				tie_pos = parse_vpos();
				s = curvoice.last_note
				for (i = 0; i <= s.nhd; i++) {
					if (!s.notes[i].ti1)
						s.notes[i].ti1 = tie_pos
					else if (s.nhd == 0)
						syntax(1, "Too many ties")
				}
				s.ti1 = true
				if (grace)
					grace.ti1 = true
				continue
			case '[':
			    var c_next = line.buffer[line.index + 1]

				if ('|[]: "'.indexOf(c_next) >= 0
				 || (c_next >= '1' && c_next <= '9')) {
					if (grace) {
						syntax(1, errs.bar_grace)
						break
					}
					new_bar()
					continue
				}
				if (line.buffer[line.index + 2] == ':') {
					i = line.buffer.indexOf(']', line.index + 1)
					if (i < 0) {
						syntax(1, "Lack of ']'")
						break
					}
					text = line.buffer.slice(line.index + 3, i).trim()

					parse.istart = parse.bol + line.index;
					parse.iend = parse.bol + ++i;
					line.index = 0;
					do_info(c_next, text);
					line.index = i
					continue
				}
				// fall thru ('[' is start of chord)
			case 'n':				// note/rest
				s = new_note(grace, tp_fact)
				if (!s)
					continue
				if (s.type == NOTE) {
					if (slur_start) {
						s.slur_start = slur_start;
						slur_start = 0
					}
				}
				if (grace) {
//fixme: tuplets in grace notes?
					if (tpn >= 0)
						s.in_tuplet = true
					continue
				}

				// set the tuplet values
				if (tpn >= 0 && s.notes) {
					s.in_tuplet = true
//fixme: only one nesting level
					if (tpn > 0) {
						if (tp_a[0].p) {
							s.tp0 = tp_a[0].p;
							s.tq0 = tp_a[0].q;
							s.tf = tp_a[0].f;
							tp_a[0].p = 0
						}
						tp_a[0].r--
						if (tp.p) {
							s.tp1 = tp.p;
							s.tq1 = tp.q;
							s.tf = tp.f;
							tp.p = 0
						}
					} else if (tp.p) {
						s.tp0 = tp.p;
						s.tq0 = tp.q;
						s.tf = tp.f;	// %%tuplets
						tp.p = 0
					}
					tp.r--
					if (tp.r == 0) {
						if (tpn-- == 0) {
							s.te0 = true;
							tp_fact = 1;
							curvoice.time = Math.round(curvoice.time);
							s.dur = curvoice.time - s.time
						} else {
							s.te1 = true;
							tp = tp_a[0]
							if (tp.r == 0) {
								tpn--;
								s.te0 = true;
								tp_fact = 1;
								curvoice.time = Math.round(curvoice.time);
								s.dur = curvoice.time - s.time
							} else {
								tp_fact = tp.fact
							}
						}
					}
				}
				continue
			case '<':				/* '<' and '>' */
				if (!curvoice.last_note) {
					syntax(1, "No note before '<'")
					break
				}
				if (grace) {
					syntax(1, "Cannot have a broken rhythm in grace notes")
					break
				}
				n = c == '<' ? 1 : -1
				while (c == '<' || c == '>') {
					n *= 2;
					c = line.next_char()
				}
				curvoice.brk_rhythm = n
				continue
			case 'i':				// ignore
				break
			case '{':
				if (grace) {
					syntax(1, "'{' in grace note")
					break
				}
				last_note_sav = curvoice.last_note;
				curvoice.last_note = null;
				a_dcn_sav = a_dcn;
				a_dcn = undefined;
				grace = {
					type: GRACE,
					fname: parse.fname,
					istart: parse.bol + line.index,
					dur: 0,
					multi: 0
				}
				switch (curvoice.pos.gst) {
				case SL_ABOVE: grace.stem = 1; break
				case SL_BELOW: grace.stem = -1; break
				case SL_HIDDEN:	grace.stem = 2; break	/* opposite */
				}
				sym_link(grace);
				c = line.next_char()
				if (c == '/') {
					grace.sappo = true	// acciaccatura
					break
				}
				continue
			case '|':
				if (grace) {
					syntax(1, errs.bar_grace)
					break
				}
				c = line.buffer[line.index - 1];
				new_bar()
				if (c == '.')
					curvoice.last_sym.bar_dotted = true
				continue
			case '}':
				s = curvoice.last_note
				if (!grace || !s) {
					syntax(1, errs.bad_char, c)
					break
				}
				if (a_dcn)
					syntax(1, "Decoration ignored");
				s.gr_end = true;
				grace.extra = grace.next;
				grace.extra.prev = null;
				grace.next = null;
				curvoice.last_sym = grace;
				grace = null
				if (!s.prev			// if one grace note
				 && !curvoice.key.k_bagpipe) {
					for (i = 0; i <= s.nhd; i++)
						s.notes[i].dur *= 2;
					s.dur *= 2;
					s.dur_orig *= 2
					var res = identify_note(s, s.dur_orig);
					s.head = res[0];
					s.dots = res[1];
					s.nflags = res[2]
				}
				curvoice.last_note = last_note_sav;
				a_dcn = a_dcn_sav
				break
			case "\\":
				c = line.buffer[line.index + 1]
				if (!c) {
					no_eol = true
					break
				}
				// fall thru
			default:
				syntax(1, errs.bad_char, c)
				break
			}
			line.index++
		}
	} // parse_seq()

	if (parse.state != 3) {		// if not in tune body
		if (parse.state != 2)
			return
		goto_tune()
	}

	parse_seq()

	if (tpn >= 0) {
		syntax(1, "No end of tuplet")
		for (s = curvoice.last_note; s; s = s.prev) {
			if (s.tp1)
				s.tp1 = 0
			if (s.tp0) {
				s.tp0 = 0
				break
			}
		}
	}
	if (grace) {
		syntax(1, "No end of grace note sequence");
		curvoice.last_sym = grace.prev;
		curvoice.last_note = last_note_sav
		if (grace.prev)
			grace.prev.next = null
	}
	if (cfmt.breakoneoln && curvoice.last_note)
		curvoice.last_note.beam_end = true
	if (no_eol || cfmt.barsperstaff)
		return
	if (char_tb['\n'.charCodeAt(0)] == '\n'
	 && par_sy.voices[curvoice.v].range == 0
	 && curvoice.last_sym)
		curvoice.last_sym.eoln = true
//--fixme: cfmt.alignbars
}
