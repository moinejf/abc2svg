// abc2svg - front.js - ABC parsing front-end
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

/* translation table from the ABC draft version 2 */
var abc_utf = {
	"`A": "À",
	"`E": "È",
	"`I": "Ì",
	"`O": "Ò",
	"`U": "Ù",
	"`a": "à",
	"`e": "è",
	"`i": "ì",
	"`o": "ò",
	"`u": "ù",
	"'A": "Á",
	"'E": "É",
	"'I": "Í",
	"'O": "Ó",
	"'U": "Ú",
	"'Y": "Ý",
	"'a": "á",
	"'e": "é",
	"'i": "í",
	"'o": "ó",
	"'u": "ú",
	"'y": "ý",
	"'S": "Ś",
	"'Z": "Ź",
	"'s": "ś",
	"'z": "ź",
	"'R": "Ŕ",
	"'L": "Ĺ",
	"'C": "Ć",
	"'N": "Ń",
	"'r": "ŕ",
	"'l": "ĺ",
	"'c": "ć",
	"'n": "ń",
	"^A": "Â",
	"^E": "Ê",
	"^I": "Î",
	"^O": "Ô",
	"^U": "Û",
	"^a": "â",
	"^e": "ê",
	"^i": "î",
	"^o": "ô",
	"^u": "û",
	"^H": "Ĥ",
	"^J": "Ĵ",
	"^h": "ĥ",
	"^j": "ĵ",
	"^C": "Ĉ",
	"^G": "Ĝ",
	"^S": "Ŝ",
	"^c": "ĉ",
	"^g": "ĝ",
	"^s": "ŝ",
	",C": "Ç",
	",c": "ç",
	",S": "Ş",
	",s": "ş",
	",T": "Ţ",
	",t": "ţ",
	",R": "Ŗ",
	",L": "Ļ",
	",G": "Ģ",
	",r": "ŗ",
	",l": "ļ",
	",g": "ģ",
	",N": "Ņ",
	",K": "Ķ",
	",n": "ņ",
	",k": "ķ",
	'"A': "Ä",
	'"E': "Ë",
	'"I': "Ï",
	'"O': "Ö",
	'"U': "Ü",
	'"Y': "Ÿ",
	'"a': "ä",
	'"e': "ë",
	'"i': "ï",
	'"o': "ö",
	'"u': "ü",
	'"y': "ÿ",
	"~A": "Ã",
	"~N": "Ñ",
	"~O": "Õ",
	"~a": "ã",
	"~n": "ñ",
	"~o": "õ",
	"~I": "Ĩ",
	"~i": "ĩ",
	"~U": "Ũ",
	"~u": "ũ",
	"oA": "Å",
	"oa": "å",
	"oU": "Ů",
	"ou": "ů",
	"=A": "Ā",
	"=D": "Đ",
	"=E": "Ē",
	"=H": "Ħ",
	"=I": "Ī",
	"=O": "Ō",
	"=T": "Ŧ",
	"=U": "Ū",
	"=a": "ā",
	"=d": "đ",
	"=e": "ē",
	"=h": "ħ",
	"=i": "ī",
	"=o": "ō",
	"=t": "ŧ",
	"=u": "ū",
	"/O": "Ø",
	"/o": "ø",
	"/D": "Đ",
	"/d": "đ",
	"/L": "Ł",
	"/l": "ł",
	";A": "Ą",
	";E": "Ę",
	";I": "Į",
	";U": "Ų",
	";a": "ą",
	";e": "ę",
	";i": "į",
	";u": "ų",
	"vL": "Ľ",
	"vS": "Š",
	"vT": "Ť",
	"vZ": "Ž",
	"vl": "ľ",
	"vs": "š",
	"vt": "ť",
	"vz": "ž",
	"vC": "Č",
	"vE": "Ě",
	"vD": "Ď",
	"vN": "Ň",
	"vR": "Ř",
	"vc": "č",
	"ve": "ě",
	"vd": "ď",
	"vn": "ň",
	"vr": "ř",
	"uA": "Ă",
	"ua": "ă",
	"uE": "Ĕ",
	"ue": "ĕ",
	"uG": "Ğ",
	"ug": "ğ",
	"uI": "Ĭ",
	"ui": "ĭ",
	"uO": "Ŏ",
	"uo": "ŏ",
	"uU": "Ŭ",
	"uu": "ŭ",
	":O": "Ő",
	":U": "Ű",
	":o": "ő",
	":u": "ű",
	".Z": "Ż",
	".z": "ż",
	".I": "İ",
	".i": "ı",
	".C": "Ċ",
	".c": "ċ",
	".G": "Ġ",
	".g": "ġ",
	".E": "Ė",
	".e": "ė",
	"AA": "Å",
	"aa": "å",
	"AE": "Æ",
	"ae": "æ",
	"cc": "ç",
	"cC": "Ç",
	"DH": "Ð",
	"dh": "ð",
	"ng": "ŋ",
	"OE": "Œ",
	"oe": "œ",
	"ss": "ß",
	"TH": "Þ",
	"th": "þ"
}

// convert the escape sequences to utf-8
function cnv_escape(src) {
	var	c, c2,
		dst = "",
		i, j = 0, codeUnits

	while (1) {
		i = src.indexOf('\\', j)
		if (i < 0)
			break
		dst += src.slice(j, i);
		c = src[++i]
		if (!c)
			return dst + '\\'
		switch (c) {
		case '0':
		case '2':
			if (src[i + 1] == '0') {
				switch (src[i + 2]) {	// compatibility
				case '1':
					dst += "\u266f";
					j = i + 3
					continue
				case '2':
					dst += "\u266d";
					j = i + 3
					continue
				case '3':
					dst += "\u266e";
					j = i + 3
					continue
				case '4':
					dst += "&#x1d12a;";
					j = i + 3
					continue
				case '5':
					dst += "&#x1d12b;";
					j = i + 3
					continue
				}
			}
				// fall thru
		case '1':
		case '3':
			if (src[i + 1] >= '0' && src[i + 1] <= '7'
			 && src[i + 2] >= '0' && src[i + 2] <= '7') {
				j = parseInt(src.slice(i, i + 3), 8);
				dst += String.fromCharCode(j);
				j = i + 3
				continue
			}
			break
		case 'u':
			codeUnits = []
			j = parseInt(src.slice(i + 1, i + 5), 16);
			codeUnits.push(j)
			if (j >= 0xd800 && j <= 0xdfff) {	// surrogates
				j = parseInt(src.slice(i + 7, i + 11), 16);
				codeUnits.push(j);
				j = i + 11
			} else {
				j = i + 5
			}
			dst += String.fromCharCode.apply(null, codeUnits)
			continue
		case 't':
			dst += ' ';
			j = i + 1
			continue
		default:
			c2 = abc_utf[src.slice(i, i + 2)]
			if (c2) {
				dst += c2;
				j = i + 2
				continue
			}
			break
		}
		dst += '\\' + c;
		j = i + 1
	}
	return dst + src.slice(j)
}

// ABC include
var include = 0

function do_include(fn) {
	var file, parse_sav

	if (!user.read_file) {
		syntax(1, "No read_file support")
		return
	}
	if (include > 2) {
		syntax(1, "Too many include levels")
		return
	}
	include++;
	file = user.read_file(fn)
	if (!file) {
		syntax(1, "Cannot read file '$1'", fn)
		return
	}
	if (fn.slice(-3) == '.js') {
		eval(file)
	} else {
		parse_sav = clone(parse);
		tosvg(fn, file);
		parse = parse_sav
	}
	include--
}

var	err_ign_s = "$1: inside tune - ignored",
	err_bad_val_s = "Bad value in $1"

// parse ABC code
function tosvg(in_fname,		// file name
		file) {			// file content
	var	i, c, bol, eol, end,
		ext, select, skip,
		line0, line1,
		last_info, opt, text, a, b, s,
		cfmt_sav, info_sav, char_tb_sav, glovar_sav, maps_sav, mac_sav,
		pscom,
		txt_add = '\n',		// for "+:"
		eof = file.length

	// check if a tune is selected
	function tune_selected() {
		var	re, res,
			i = file.indexOf('K:', bol)

		if (i < 0) {
//			syntax(1, "No K: in tune")
			return false
		}
		i = file.indexOf('\n', i)
		if (parse.select.test(file.slice(bol, i)))
			return true
		re = /\n\w*\n/;
		re.lastIndex = i;
		res = re.exec(file)
		if (res)
			eol = re.lastIndex
		else
			eol = eof
		return false
	} // tune_selected()

	// remove the comment at end of text
	function uncomment(src, do_escape) {
		var i, j, c, l

		if (do_escape && src.indexOf('\\') >= 0)
			src = cnv_escape(src);
		l = src.length
		for (i = 0; i < l; i++) {
			c = src[i]
			switch (c) {
			case '\\':
				i++
				continue
			case '%':
				return src.slice(0, i).replace(/\s+$/, '')
			case '"':
				break
			default:
				continue
			}
			j = i + 1
			for (;;) {			// in ".." sequence
				j = src.indexOf('"', j)
				if (j < 0)
					break		// fixme: no string end
				if (src[j - 1] != '\\')
					break
			}
			if (j < 0)
				break
			i = j
		}
		src = src.replace(/\s+$/, '');		// trimRight
		return src.replace(/\\%/g,'%')
	} // uncomment()

	function end_tune() {
		generate()
		if (info.W)
			put_words(info.W);
		put_history();
		blk_out();
		blk_flush();
		parse.state = 0;		// file header
		cfmt = cfmt_sav;
		set_posx();
		info = info_sav;
		char_tb = char_tb_sav;
		glovar = glovar_sav;
		maps = maps_sav;
		mac = mac_sav;
		init_tune()
	} // end_tune()

	// initialize
	parse.file = file;		// used for errors
	parse.ctx = {
		fname: in_fname
	}

	// scan the file
	bol = 0
	for (bol = 0; bol < eof; bol = parse.eol + 1) {
		eol = file.indexOf('\n', bol)	// get a line
		if (eol < 0)
			eol = eof;
		parse.eol = eol

		// remove the ending white spaces
		while (1) {
			eol--
			switch (file[eol]) {
			case ' ':
			case '\t':
				continue
			}
			break
		}
		eol++
		if (skip) {			// tune skip
			if (eol != bol)
				continue
			skip = false
		}
		if (eol == bol) {		// empty line
			if (parse.state == 1) {
				parse.istart = bol;
				syntax(1, "Empty line in tune header - ignored")
			} else if (parse.state >= 2)
				end_tune()
			continue
		}
		parse.istart = parse.bol = bol;
		parse.iend = eol;
		parse.line.index = 0;

		// check if the line is a pseudo-comment or I:
		line0 = file[bol];
		line1 = file[bol + 1]
		if (line0 == '%') {
			if (parse.prefix.indexOf(line1) < 0)
				continue		// comment

			// change "%%abc xxxx" to "xxxx"
			if (file[bol + 2] == 'a'
			 && file[bol + 3] == 'b'
			 && file[bol + 4] == 'c'
			 && file[bol + 5] == ' ') {
				bol += 6;
				line0 = file[bol];
				line1 = file[bol + 1]
			} else {
				pscom = true
			}
		} else if (line0 == 'I' && line1 == ':') {
			pscom = true
		}

		// pseudo-comments
		if (pscom) {
			pscom = false;
			bol += 2		// skip %%/I:
			while (1) {
				switch (file[bol]) {
				case ' ':
				case '\t':
					bol++
					continue
				}
				break
			}
			text = file.slice(bol, eol)
			if (!text || text[0] == '%')
				continue
			a = text.split(/\s+/, 2)
			if (!a[0])
				a.shift()
			switch (a[0]) {
			case "abcm2ps":
			case "ss-pref":
				parse.prefix = a[1]
				continue
			case "abc-include":
				ext = a[1].match(/.*\.(.*)/)
				if (!ext)
					continue
				switch (ext[1]) {
				case "abc":
				case "js":
					do_include(a[1])
					break
				}
				continue
			}

			// beginxxx/endxxx
			b = a[0].match(/begin(.*)/)
			if (b) {
//fixme: ignore "I:beginxxx" ... ?
				end = '\n' + line0 + line1 + "end" + b[1];
				i = file.indexOf(end, eol)
				if (i < 0) {
					syntax(1, "No $1 after %%$2",
							end.slice(1), b[0]);
					parse.eol = eof
					continue
				}
				do_begin_end(b[1], a[1],
					file.slice(eol + 1, i).replace(
						new RegExp('^' + line0 + line1, 'gm'),
										''));
				parse.eol = file.indexOf('\n', i + 6)
				if (parse.eol < 0)
					parse.eol = eof
				continue
			}
			switch (a[0]) {
			case "select":
				if (parse.state != 0) {
					syntax(1, "%%select ignored")
					continue
				}
				select = uncomment(text.slice(7).trim(),
							false)
				if (select[0] == '"')
					select = select.slice(1, -1);
				select = select.replace(/\(/g, '\\(');
				select = select.replace(/\)/g, '\\)');
//				select = select.replace(/\|/g, '\\|');
				parse.select = new RegExp(select, 'm')
				continue
			case "tune":
				syntax(1, "%%tune not treated yet")
				continue
			case "voice":
				if (parse.state != 0) {
					syntax(1, "%%voice ignored")
					continue
				}
				select = uncomment(text.slice(6).trim(), false)

				/* if void %%voice, free all voice options */
				if (!select) {
					if (parse.cur_tune_opts)
						parse.cur_tune_opts.voice_opts = null
					else
						parse.voice_opts = null
					continue
				}
				
				if (select == "end")
					continue	/* end of previous %%voice */

				/* get the voice options */
				if (parse.cur_tune_opts) {
					if (!parse.cur_tune_opts.voice_opts)
						parse.cur_tune_opts.voice_opts = {}
					opt = parse.cur_tune_opts.voice_opts
				} else {
					if (!parse.voice_opts)
						parse.voice_opts = {}
					opt = parse.voice_opts
				}
				opt[select] = []
				while (1) {
					bol = ++eol
					if (file[bol] != '%')
						break
					eol = file.indexOf('\n', eol);
					if (file[bol + 1] != line1)
						continue
					bol += 2
					if (eol < 0)
						text = file.slice(bol)
					else
						text = file.slice(bol, eol);
					a = text.match(/\S+/)
					switch (a[0]) {
					default:
						opt[select].push(
							uncomment(text.trim(), true))
						continue
					case "score":
					case "staves":
					case "tune":
					case "voice":
						bol -= 2
						break
					}
					break
				}
				parse.eol = bol - 1
				continue
			}
			do_pscom(uncomment(text.trim(), true))
			continue
		}

		// music line (or free text)
		if (line1 != ':') {
			last_info = undefined;
			if (parse.state < 2)
				continue
			parse.line.buffer = file.slice(bol, eol);
			parse_music_line()
			continue
		}

		// information fields
		text = uncomment(file.slice(bol + 2, eol).trim(),
				 true)
		if (line0 == '+') {
			if (!last_info) {
				syntax(1, "+: without previous info field")
				continue
			}
			txt_add = ' ';		// concatenate
			line0 = last_info
		}

		switch (line0) {
		case 'X':			// start of tune
			if (parse.state != 0) {
				syntax(1, err_ign_s, line0)
				continue
			}
			if (parse.select
			 && !tune_selected()) {
				skip = true
				continue
			}

			cfmt_sav = clone(cfmt);
			cfmt.pos = clone(cfmt.pos);
			info_sav = clone(info)
			if (info.V) {
				info_sav.V = {}
				for (i in info.V)
				    if (info.V.hasOwnProperty(i))
					info_sav.V[i] = clone(info.V[i])
			}
			char_tb_sav = clone(char_tb);
			glovar_sav = clone(glovar);
			maps_sav = maps;
			mac_sav = mac;
			info.X = text;
			parse.state = 1			// tune header
			continue
		case 'T':
			switch (parse.state) {
			case 0:
				continue
			case 1:
				if (info.T == undefined)	// (keep empty T:)
					info.T = text
				else
					info.T += "\n" + text
				continue
			}
			s = new_block("title");
			s.text = text
			continue
		case 'K':
			switch (parse.state) {
			case 0:
				continue
			case 1:				// tune header
				info.K = text
				break
			}
			do_info(line0, text)
			continue
		case 'W':
			if (parse.state == 0
			 || cfmt.writefields.indexOf(line0) < 0)
				break
			if (info.W == undefined)
				info.W = text
			else
				info.W += txt_add + text
			break

		case 'm':
			if (parse.state >= 2) {
				syntax(1, err_ign_s, line0)
				continue
			}
			if ((!cfmt.sound || cfmt.sound != "play")
			 && cfmt.writefields.indexOf(line0) < 0)
				break
			a = text.match(/(.*?)[= ]+(.*)/)
			if (!a || !a[2]) {
				syntax(1, err_bad_val_s, "m:")
				continue
			}
			if (a[1].indexOf('n') >= 0)	// dynamic
				a[1] = a[1].replace('n', ".[',]?");
			mac[a[1]] = a[2]
			break

		// info fields in tune body only
		case 's':
			if (parse.state != 3)
				break
//--fixme: to do
			break
		case 'w':
			if (parse.state != 3
			 || cfmt.writefields.indexOf(line0) < 0)
				break
			get_lyrics(text, txt_add == ' ')
			if (text.slice(-1) == '\\') {	// old continuation
				txt_add = ' ';
				last_info = line0
				continue
			}
			break
		case '|':			// "|:" starts a music line
			if (parse.state < 2)
				continue
			parse.line.buffer = file.slice(bol, eol);
			parse_music_line()
			continue
		default:
			if ("ABCDFGHOSZ".indexOf(line0) >= 0) {
				if (parse.state >= 2) {
					syntax(1, err_ign_s, line0)
					continue
				}
//				if (cfmt.writefields.indexOf(c) < 0)
//					break
				if (!info[line0])
					info[line0] = text
				else
					info[line0] += txt_add + text
				break
			}

			// info field which may be embedded
			do_info(line0, text)
			continue
		}
		txt_add = '\n';
		last_info = line0
	}
	if (include)
		return
	if (parse.state >= 2)
		end_tune();
	blk_flush();
	parse.state = 0
}
Abc.prototype.tosvg = tosvg
