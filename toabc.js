// abc2svg - toabc.js - convert ABC to ABC
//
// Copyright (C) 2016-2018 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// constants from core/abc2svg.js
    var	BAR = 0,
	CLEF = 1,
	CUSTOS = 2,
//	FORMAT = 3,
	GRACE = 4,
	KEY = 5,
	METER = 6,
	MREST = 7,
	NOTE = 8,
	PART = 9,
	REST = 10,
	SPACE = 11,
	STAVES = 12,
	STBRK = 13,
	TEMPO = 14,
//	TUPLET = 15,
	BLOCK = 16,
	REMARK = 17,

	SL_ABOVE = 0x01,
	SL_BELOW = 0x02,
	SL_AUTO = 0x03,
	SL_HIDDEN = 0x04,
	SL_DOTTED = 0x08,

	OPEN_BRACE = 0x01,
	CLOSE_BRACE = 0x02,
	OPEN_BRACKET = 0x04,
	CLOSE_BRACKET = 0x08,
	OPEN_PARENTH = 0x10,
	CLOSE_PARENTH = 0x20,
	STOP_BAR = 0x40,
	FL_VOICE = 0x80,
	OPEN_BRACE2 = 0x0100,
	CLOSE_BRACE2 = 0x0200,
	OPEN_BRACKET2 = 0x0400,
	CLOSE_BRACKET2 = 0x0800,
	MASTER_VOICE = 0x1000,

	BASE_LEN = 1536

    var	deco_l = {			// decorations
		dot: '.',
		fermata: 'H',
		emphasis: 'L',
		lowermordent: 'M',
		coda: 'O',
		uppermordent: 'P',
		segno: 'S',
		trill: 'T',
		upbow: 'u',
		downbow: 'v',
		roll: '~'
	},
	mode_tb = [			// key modes
		[0, ""],
		[2, "dor"],
		[4, "phr"],
		[-1, "lyd"],
		[1, "mix"],
		[3, "m"],
		[5, "loc"]
	]

function abc_dump(tsfirst, voice_tb, music_types, info) {
    var	i, v, s, g, line, ulen, tmp, tmp2, grace, bagpipe, eoln, curv,
	nv = voice_tb.length,
	vo = [],		// dump line per voice
	vold = [],		// false/true for voice name
	vti = []

	function info_out(inf) {
		if (vo[s.v].length != 0)
			line += '[' + inf + ']'
		else
			abc2svg.print(inf)
	} // info_out()

	function voice_out() {
		function vi_out(v) {
			if (v == curv)		// (for one voice in %score)
				return
			curv = v
		    var	p_voice = voice_tb[v],
			ln = 'V:' + p_voice.id

			if (!vold[v]) {
				vold[v] = true
				if (p_voice.clef
				 && p_voice.clef.clef_type != 'a')
					ln += ' ' + clef_dump(p_voice.clef)
				if (p_voice.nm)
					ln += ' nm="' + p_voice.nm + '"'
				if (p_voice.snm)
					ln += ' snm="' + p_voice.snm + '"';
				if (p_voice.scale != 1)
					ln += ' scale=' + p_voice.scale
				if (p_voice.uscale)
					ln += ' microscale=' + p_voice.uscale
			}
			abc2svg.print(ln)
		} // vi_out()

		eoln = false
		if (nv == 1) {
			if (vo[0].length == 0)
				return
			if (!vold[0]
			 && (voice_tb[0].nm || voice_tb[0].snm
			  || voice_tb[0].scale != 1 || voice_tb[0].uscale))
				vi_out(0);
			abc2svg.print(vo[0].join(''));
			vo[0] = []
			return
		}
		for (var v = 0; v < nv; v++) {
			if (vo[v].length == 0)
				continue
			vi_out(v);
			abc2svg.print(vo[v].join(''));
			vo[v] = []
		}
	} // voice_out()

	function block_dump(s) {
	    var	ln = "%%" + s.subtype + ' '
		switch (s.subtype) {
		case "ml":
			ln += s.text
			break
		case "leftmargin":
		case "rightmargin":
		case "pagescale":
		case "pagewidth":
		case "scale":
		case "staffwidth":
			ln += s.param
			break
		case "sep":
			ln += s.sk1.toFixed(2) + ' ' +
				s.l.toFixed(2) + ' ' +
				s.sk2.toFixed(2)
			break
		case "skip":
			ln += s.sk
			break
		case "text":
			if (s.text.indexOf('\n') <= 0
			 && (!s.opt || s.opt == 'c')) {
				if (s.opt == 'c')
					ln = "%%center " + s.text
				else
					ln += s.text
				break
			}
			ln = "%%begintext"
			switch (s.opt) {
			case 'c': ln += " center"; break
			case 'f': ln += " fill"; break
			case 'j': ln += " justify"; break
			case 'r': ln += " right"; break
			}
			abc2svg.print(ln +
				'\n%%' + s.text.replace(/\n/g, '\n%%') +
				"\n%%endtext")
			return
		case "title":
			abc2svg.print('T:' + s.text.replace(/\n/g, '\nT:'))
			return
		default:
			ln += "(unknown)"
			break
		}
		abc2svg.print(ln)
	} // block_dump()

	function clef_dump(s) {
	    var	ln
		switch (s.clef_type) {
		case 't': ln = "treble"; break
		case 'c': ln = "alto"; break
		case 'b': ln = "bass"; break
		case 'a': ln = "auto"; break
		case 'p': ln = "perc"; break
		default:  ln = s.clef_name; break
		}
		if (s.clef_octave == 7)
			ln += (s.clef_oct_transp ? '^' : '+') + '8'
		else if (s.clef_octave == -7)
			ln += (s.clef_oct_transp ? '_' : '-') + '8'
		return "clef=" + ln
	} // clef_dump()

	function deco_dump(a_dd) {
	    var	i, n
//fixme: check if user deco
		for (i = 0; i < a_dd.length; i++) {
			n = a_dd[i].name
			if (deco_l[n])
				line += deco_l[n]
			else
				line += '!' + n + '!'
		}
	} // deco_dump

	function dur_dump(dur, grace) {
	    var	d = 0,
		l = grace ? BASE_LEN / 4 : ulen
		if (dur == l)
			return
		while (1) {
			if (dur % l == 0) {
				dur /= l
				if (dur != 1)
					line += dur.toString()
				break
			}
			dur *= 2
if (d > 6) {
abc2svg.print("% *** bad duration")
break
}
			d++
		}
		if (d > 0)
			line += "//////".slice(0, d)
	} // dur_dump()

	function gch_dump(a_gch) {
	    var i, j, gch
		for (i = 0; i < a_gch.length; i++) {
			line += '"';
			gch = a_gch[i]
			switch (gch.type) {
			case 'g':
				for (j = 0; j < gch.text.length; j++) {
					switch (gch.text.charCodeAt(j)) {
					case 0x266d:
						line += 'b'
						break
					case 0x266e:
						line += '='
						break
					case 0x266f:
						line += '#'
						break
					default:
						line += gch.text[j]
						break
					}
				}
				line += '"'
				continue
			case '@':
				line += '@' + gch.x + ',' + gch.y
				break
			default:
				line += gch.type
			}
			line += gch.text + '"'
		}
	} // gch_dump()

	function header_dump(hl) {
	    var l
		for (var i = 0; i < hl.length; i++) {
			l = hl[i]
			if (info[l])
				abc2svg.print(l + ':' + info[l].replace(/\n/g, '\n' + l + ':'))
		}
	} // header_dump()

	function key_dump(s, clef) {
	    var	ln
		if (s.k_bagpipe) {
			bagpipe = true			// for grace notes
			ln = "K:H" + s.k_bagpipe
		} else if (s.k_drum) {
			ln = "K:P"
		} else if (s.k_none) {
			ln = "K:none"
		} else {
			ln = "K:"
			switch (s.k_sf + mode_tb[s.k_mode][0]) {
			case -7: ln += 'Cb'; break
			case -6: ln += 'Gb'; break
			case -5: ln += 'Db'; break
			case -4: ln += 'Ab'; break
			case -3: ln += 'Eb'; break
			case -2: ln += 'Bb'; break
			case -1: ln += 'F'; break
			case 1: ln += 'G'; break
			case 2: ln += 'D'; break
			case 3: ln += 'A'; break
			case 4: ln += 'E'; break
			case 5: ln += 'B'; break
			case 6: ln += 'F#'; break
			case 7: ln += 'C#'; break
			default: ln += 'C'; break
			}
			ln += mode_tb[s.k_mode][1]
		}

		if (clef && clef.clef_type != 'a')
			ln += ' ' + clef_dump(clef)
//fixme: to continue
		return ln
	} // key_dump()

	function lyric_dump() {
	    var	v, s, i, ly, nly, t, w,
		nb = 0

		for (v = 0; v < nv; v++) {
			nly = 0;
			w = []
			for (s = voice_tb[v].sym; s; s = s.next) {
				ly = s.a_ly
				if (ly)
					while (nly < ly.length)
						w[nly++] = ""
			}
			if (nly == 0)
				continue
			for (s = voice_tb[v].sym; s; s = s.next) {
				switch (s.type) {
				case BAR:
					if (w.length == 0)
						continue
					if (++nb < 4)
						continue
					nb = 0
					if (!s.next)
						continue
					for (i = 0; i < nly; i++)
						w[i] += '\n'
//					t =  "|"
//					if (++nb >= 4) {
//						nb = 0;
//						t = "|\n"
//					}
//					for (i = 0; i < nly; i++)
//						w[i] += t
				default:
					continue
				case NOTE:
					break
				}
				ly = s.a_ly
				if (!ly) {
					for (i = 0; i < nly; i++)
						w[i] += "*"
					continue
				}
				for (i = 0; i < nly; i++) {
					if (!w[i])
						w[i] = ""
					if (!ly[i]) {
						w[i] += '*'
						continue
					}
					t = ly[i].t
					switch (t) {
					case '-\n':
						w[i] += '-'
						break
					case '_\n':
						w[i] += '_'
						break
					default:
						t = t.replace(/ /g, '~')
						t = t.replace(/-/g, '\\-')
						t = t.replace(/\n/g, '-');
						w[i] += t + ' '
						break
					}
				}
			}
			if (w.length != 0) {
				if (voice_tb.length > 1)
					abc2svg.print("V:" + voice_tb[v].id)
				for (i = 0; i < w.length; i++)
					abc2svg.print("w:" + w[i].replace(/\n/g, '\n+:'))
			}
		}
	} // lyric_dump()

	function meter_dump(s) {
	    var	i, ln
		if (s.wmeasure == 1)
			return "M:none"
		ln = "M:"
		for (i = 0; i < s.a_meter.length; i++) {
			if (i != 0)
				ln += ' ';
			ln += s.a_meter[i].top
			if (s.a_meter[i].bot)
				ln += '/' + s.a_meter[i].bot
		}
		return ln
	} // meter_dump()

	function note_dump(s, note, tie_ch) {
	    var	p, j
		if (note.sl1)
			slti_dump(note.sl1, '(')
		if (note.a_dcn) {
			for (j = 0; j < note.a_dcn.length; j++)
				line += '!' + note.a_dcn[j] + '!'
		}
		if (note.color)
			line += "!" + note.color + "!"
		switch (note.acc) {
		case -2: line += '__'; break
		case -1: line += '_'; break
		case 1: line += '^'; break
		case 2: line += '^^'; break
		case 3: line += '='; break
		}
		if (note.micro_n) {
			if (s.p_v.uscale)
				line += note.micro_n
			else
				line += dur_dump(BASE_LEN / 4 *
							note.micro_n / note.micro_d,
						true)
		}
		p = note.apit
		if (p >= 23) {
			line += "abcdefg"[p % 7]
			if (p >= 30) {
				line += "'"
				if (p >= 37)
					line += "'"
			}
		} else {
			p += 7;			// for very low notes
			line += "ABCDEFG"[p % 7]
			if (p < 23) {
				line += ","
				if (p < 16) {
					line += ","
					if (p < 9)
						line += ","
				}
			}
		}
		if (!tie_ch && note.ti1)
			slti_dump(note.ti1, '-')
		if (note.sl2)
			line += ')'
	} // note_dump()

	function slti_dump(fl, ty) {
		if (fl & SL_DOTTED)
			line += ".";
		line += ty
		switch (fl & 0x07) {
		case SL_ABOVE:
			line += "'"
			break
		case SL_BELOW:
			line += ','
			break
		}
	} // slti_dump()

//fixme: missing: '+' (master voice) and '*' (floating voice)
	function staves_dump(s) {
	    var	v, p_v, staff, ln,
		in_parenth,
		vn = [],
		st = -1,
		sy = s.sy;

		curv = -1;
		ln = "%%score "
		for (v = 0; v < sy.voices.length; v++) {
			p_v = sy.voices[v]
			if (p_v.range >= 0)
				vn[p_v.range] = v
		}
		for (v = 0; v < sy.voices.length; v++) {
			if (vn[v] == undefined || vn[v] < 0)
				continue
			p_v = sy.voices[vn[v]]
			if (p_v.st != st) {
				if (st >= 0) {
					if (in_parenth) {
						ln += ')';
						in_parenth = false
					}
					if (staff.flags & CLOSE_BRACE2)
						ln += '}'
					if (staff.flags & CLOSE_BRACE)
						ln += '}'
					if (staff.flags & CLOSE_BRACKET2)
						ln += ']'
					if (staff.flags & CLOSE_BRACKET)
						ln += ']'
					if (!(staff.flags & STOP_BAR))
						ln += '|'
				}
				staff = sy.staves[++st]
				if (staff.flags & OPEN_BRACKET)
					ln += '['
				if (staff.flags & OPEN_BRACKET2)
					ln += '['
				if (staff.flags & OPEN_BRACE)
					ln += '{'
				if (staff.flags & OPEN_BRACE2)
					ln += '{'
				if (v < vn.length - 1
				 && vn[v + 1] != undefined
				 && vn[v + 1] >= 0
				 && voice_tb[vn[v + 1]].second) {
					ln += '(';
					in_parenth = true
				}
			}
			ln += voice_tb[vn[v]].id + ' '
		}
		if (in_parenth)
			ln += ')'
		if (staff.flags & CLOSE_BRACE2)
			ln += '}'
		if (staff.flags & CLOSE_BRACE)
			ln += '}'
		if (staff.flags & CLOSE_BRACKET2)
			ln += ']'
		if (staff.flags & CLOSE_BRACKET)
			ln += ']';

		// output the following bars
		for (s = s.ts_next; s; s = s.ts_next) {
			if (s.type != BAR)
				break
			if (s.time != vti[s.v])
				continue
			sym_dump(s);
			s.del = true
			if (line) {
				vo[s.v].push(line);
				line = ""
			}
		}
		voice_out();
		abc2svg.print(ln)
		for (v = 0; v < nv; v++)
			vti[v] = s.time
	} // staves_dump()

	function tempo_dump(s) {
	    var	i,
		ln = 'Q:'

		function qdur_dump(dur) {
		    var	d = 0,
			l = BASE_LEN
			if (dur == l)
				ln += "1/1"
			while (1) {
				if (dur % l == 0) {
					dur /= l;
					ln += dur.toString()
					break
				}
				dur *= 2
				d++
			}
			if (d > 0)
				ln += '/' + Math.pow(2, d)
		} // qdur_dump()

		if (s.tempo_str1)
			ln += '"' + s.tempo_str1 + '"'
		if (s.tempo_notes && s.tempo_notes.length > 0) {
			for (i = 0; i < s.tempo_notes.length; i++) {
				if (i != 0)
					ln += ' ';
				qdur_dump(s.tempo_notes[i])
			}
		}
		if (s.tempo || s.new_beat) {
			ln += '='
			if (s.tempo_ca)
				ln += s.tempo_ca
			if (s.tempo)
				ln += s.tempo
			else
				qdur_dump(s.new_beat)
		}
		if (s.tempo_str2)
			ln += '"' + s.tempo_str2 + '"'
		info_out(ln)
	} // tempo_dump()

	function tuplet_dump(s) {
	    var	s2, r
		if (s.tp0) {
			line += '(' + s.tp0;
			r = 1
			for (s2 = s.next; s2; s2 = s2.next) {
				if (!s2.dur)
					continue
				r++
				if (s2.te0)
					break
			}
			if (r == s.tp0
			 && ((s.tp0 == 2 && s.tq0 == 3)
			  || (s.tp0 == 3 && s.tq0 == 2)
			  || (s.tp0 == 4 && s.tq0 == 3)))
				;
			else
				line += ':' + s.tq0 + ':' + r
		}
		if (s.tp1) {
			line += '(' + s.tp1;
			r = 1
			for (s2 = s.next; s2; s2 = s2.next) {
				if (!s2.dur)
					continue
				r++
				if (s2.te1)
					break
			}
			if (r == s.tp1
			 && ((s.tp1 == 2 && s.tq1 == 3)
			  || (s.tp1 == 3 && s.tq1 == 2)
			  || (s.tp1 == 4 && s.tq1 == 3)))
				;
			else
				line += ':' + s.tq1 + ':' + r
		}
	} // tuplet_dump()

	function sym_dump(s) {
	    var	tie_ch

		if (s.repeat_n) {
			if (s.repeat_n < 0)
				line += "[I:repeat " + (-s.repeat_n).toString() +
					' ' + s.repeat_k + ']'
			else
				line += "[I:repeat " + s.repeat_n +
					' ' + s.repeat_k + ']'
		}
		if (s.tp0 || s.tp1)
			tuplet_dump(s)
		tmp = s.slur_start
		while (tmp) {
			slti_dump(tmp, '(');
			tmp >>= 4
		}
		if (s.a_gch)
			gch_dump(s.a_gch)
		if (s.a_dd)
			deco_dump(s.a_dd)
		if (s.invis && s.type != REST && s.type != SPACE)
			line += "!invisible!"
		if (s.color)
			line += "!" + s.color + "!"
		if (s.feathered_beam)
			line += s.feathered_beam > 0 ? "!beam-accel!" : "!beam-rall!"
		switch (s.type) {
		case BAR:
			if (s.beam_on)
				line += "!beamon!"
			if (s.bar_dotted)
				line += '.';
			line += s.bar_type
			if (s.text) {
				if (s.text[0] >= '0' && s.text[0] <= '9')
					line += s.text + ' '
				else
					line += '"' + s.text + '"'
			}
			break
		case CLEF:
			info_out("K: " + clef_dump(s))
			break
		case CUSTOS:
			break
		case GRACE:
			line += '{'
			if (s.sappo)
				line += '/'
			for (g = s.extra; g; g = g.next)
				sym_dump(g)
			if (s.gr_shift)
				line += ' ';
			line += '}'
			break
		case KEY:
			info_out(key_dump(s))
			break
		case METER:
			info_out(meter_dump(s))
			break
		case MREST:
			line += s.invis ? 'X' : 'Z'
			if (s.nmes != 1)
				line += s.nmes
			break
		case NOTE:
			if (s.beam_br1)
				line += "!beambr1!"
			if (s.beam_br2)
				line += "!beambr2!"
			if (s.trem1)
				line += '!' + "///".slice(0, s.ntrem) + '!'
			if (s.xstem)
				line += "!xstem!"
			if (s.stemless
			 && s.notes[0].dur < BASE_LEN)	// head duration
				line += "!stemless!"
			if (s.trem22)
				line += "!trem" + s.ntrem + "!"
			else if (s.trem2 && s.next && s.next.trem2)
				s.next.trem22 = true
			tie_ch = true
			if (s.notes.length == 1) {
				note_dump(s, s.notes[0], tie_ch)
			} else {
				for (i = 0; i < s.notes.length; i++) {
					if (!s.notes[i].ti1) {
						tie_ch = false
						break
					}
				}
				line += '['
				for (i = 0; i < s.notes.length; i++)
					note_dump(s, s.notes[i], tie_ch);
				line += ']'
			}
			if (s.grace) {
				if (bagpipe) {
					tmp = s.dur * 8
				} else {
					tmp = s.dur * 2
					if (s.prev || s.next)
						tmp *= 2
				}
				dur_dump(tmp, true)
			} else {
				tmp = s.notes[0].dur	// head duration
				if (s.trem2)
					tmp /= 2;
				dur_dump(tmp)
			}
			if (s.ti1 && tie_ch)
				slti_dump(s.notes[0].ti1, '-');
			tmp = s.slur_end
			while (tmp) {
				line += ')';
				tmp--
			}
			break
		case PART:
			info_out('P:' + s.text)
			break
		case REST:
			line += s.invis ? 'x' : 'z';
			dur_dump(s.dur)
			break
		case SPACE:
			line += 'y'
			if (s.width != 10)
				line += s.width
			break
		case STAVES:
			if (nv == 1)
				break
			staves_dump(s)
			break
		case STBRK:
			voice_out();
			abc2svg.print('%%staffbreak ' + s.xmx.toString() +
				(s.stbrk_forced ? 'f' : ''))
			break
		case TEMPO:
			tempo_dump(s)
			break
		case BLOCK:
			voice_out();
			block_dump(s)
			break
		case REMARK:
			info_out('r:' + s.text)
			break
		default:
			voice_out();
			abc2svg.print('% ??sym: ' + music_types[s.type])
			break
		}
	} // sym_dump()

	abc2svg.print('\nX:' + info['X'])
	header_dump("TC")

	abc2svg.print(meter_dump(voice_tb[0].meter));

	ulen = voice_tb[0].ulen < 0 ? BASE_LEN / 4 : voice_tb[0].ulen;
	abc2svg.print('L:1/' + (BASE_LEN / ulen).toString());

	header_dump("OABDFGRNPSZH")

	for (v = 0; v < nv; v++) {
		vo[v] = [];
		vti[v] = 0
	}

	if (info.Q) {
		for (s = tsfirst; s; s = s.ts_next) {
			if (s.type == TEMPO) {
				tempo_dump(s);
				s.del = true
				break
			}
		}
	}
	abc2svg.print(key_dump(voice_tb[0].key, voice_tb[0].clef))

	// loop by time
	for (s = tsfirst; s; s = s.ts_next) {
		if (eoln && s.seqst)
			voice_out();
		if (s.del)
			continue
		line = "";
		// (all voices are synchronized on %%score)
		if (s.type != STAVES && s.time > vti[s.v]) {
//fixme: put 'X' if more than one measure
			line += 'x';
			dur_dump(s.time - vti[s.v]);
			vti[s.v] = s.time
		}
		sym_dump(s)
		if (s.dur)
			vti[s.v] = s.time + s.dur
		if (s.beam_end)
			line += ' '
		if (s.eoln && s.next) {
			line += '$';
			eoln = true
		}
		if (line)
			vo[s.v].push(line)
	}
	voice_out();
	lyric_dump();
	header_dump("W")
} // abc_dump()
user.get_abcmodel = abc_dump

// -- local functions
abc2svg.abc_init = function() {
	abc2svg.print('%abc-2.2\n\
% generated by abc2svg toabc\n\
%%linebreak $')
}

abc2svg.abc_end = function() {
	if (user.errtxt)
		abc2svg.print("Errors:\n" + user.errtxt)
}

abc2svg.abort = function(e) {
	abc2svg.print(e.message + "\n*** Abort ***\n" + e.stack);
	abc2svg.abc_end();
	abc2svg.quit()
}
