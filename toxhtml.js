// abc2svg - toxhtml.js - SVG generation
//
// Copyright (C) 2014-2018 Jean-Francois Moine
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

    var	o_font, c_font, wto,
	init_done, pw, ml, mr, pkf, lkf

// replace <>& by XML character references
function clean_txt(txt) {
	return txt.replace(/<|>|&.*?;|&/g, function(c) {
		switch (c) {
		case '<': return "&lt;"
		case '>': return "&gt;"
		}
		if (c == '&')
			return "&amp;"
		return c
	})
}

abc2svg.abort = function(e) {
	if (!init_done)				// if empty document
		user.img_out('')
	abc.blk_flush();
	if (typeof abc2svg.printErr == 'function')
		abc2svg.printErr(e.message + "\n*** Abort ***\n" + e.stack)
	else
		abc2svg.print("<pre>" + e.message + "\n*** Abort ***\n" + e.stack + "</pre>");
	abc2svg.abc_end();
	abc2svg.quit()
}

function get_date() {
	return (new Date()).toUTCString()
} // get_date()

function header_footer(str) {
    var	c, i, t,
	j = 0,
	r = ["", "", ""]

	if (str[0] == '"')
		str = str.slice(1, -1)
	if (str.indexOf('\t') < 0)		// if no TAB
		str = '\t' + str		// center

	for (i = 0; i < str.length; i++) {
		c = str[i]
		switch (c) {
		case '\t':
			if (j < 2)
				j++		// next column
			continue
		case '\\':			// hope '\n'
			for (j = 0; j < 3; j++)
				r[j] += '<br/>';
			j = 0;
			i++
			continue
		default:
			r[j] += c
			continue
		case '$':
			break
		}
		c = str[++i]
		switch (c) {
		case 'd':	// cannot know the modification date of the file
			break
		case 'D':
			r[j] += get_date()
			break
		case 'F':
			r[j] += abc.get_fname()
			break
		case 'I':
			c = str[++i]
		case 'T':
			t = abc.get_info(c)
			if (t)
				r[j] += t.split('\n', 1)[0]
			break
		case 'P':
			r[j] += '\x0c'	// form feed
			break
		case 'V':
			r[j] += "abc2svg-" + abc2svg.version
			break
		}
	}
	return r
} // header_footer()

// set a paragraph style
function set_pstyle() {
    var	nml, nmr, nlkf, npkf, npw,
	psty = '';

	nml = abc.get_cfmt("leftmargin");
	if (nml != ml) {
		if (ml == undefined)
			ml = nml;
		psty += 'margin-left:' + nml.toFixed(2) + 'px;'
	}
	nmr = abc.get_cfmt("rightmargin");
	if (nmr != mr) {
		if (mr == undefined)
			mr = nmr;
		psty += 'margin-right:' + nmr.toFixed(2) + 'px;'
	}
	nlkf = abc.get_cfmt("lineskipfac");
	if (nlkf != lkf) {
		if (lkf == undefined)
			lkf = nlkf;
		psty += 'line-height:' + ((nlkf * 100) | 0).toString() + '%;'
	}
	npkf = abc.get_cfmt("parskipfac");
	if (npkf != pkf) {
		if (pkf == undefined)
			pkf = npkf;
		psty += 'margin-bottom:' + npkf.toFixed(2) + 'em;'
	}
	npw = abc.get_cfmt("pagewidth")
	if (npw != pw || nml != ml || nmr != mr) {
		if (pw == undefined)
			pw = npw;
		psty += 'width:' + (npw - nml - nmr).toFixed(2) + 'px;'
	}

	return psty
}

function para_start(action, skip) {
    var	r,
	sc = abc.get_cfmt("scale"),
	newpage = abc.get_newpage() ? 'newpage ' : '',
	sty = '<p class="' + newpage,
	psty = set_pstyle()

	if (o_font.class)
		sty += o_font.class
	else
		sty += 'f' + o_font.fid

	if (skip)
		psty += 'margin-top:' + skip.toFixed(2) + 'px;'

	switch (action) {
	case 'c':
		psty += 'text-align:center;'
		break
	case 'r':
		psty += 'text-align:right;'
		break
	case 'j':
		psty += 'text-align:justify;'
		break
	}
	if (psty)
		sty += '" style="' + psty
	return sty + '">'
} // para_start()

function para_build(str) {
    var	n_font, txt,
	 span = ''

	if (c_font != o_font) {
		span += '<span class="'
		if (c_font.class)
			span += c_font.class
		else
			span += 'f' + c_font.fid
		span += '">'
	}
	txt = str.replace(/<|>|&.*?;|&|  |\$./g, function(c){
		switch (c[0]) {
		case '<': return "&lt;"
		case '>': return "&gt;"
		case '&':
			if (c == '&')
				 return "&amp;"
			return c
		case ' ':
			return '  '		// space + nbspace
		case '$':
			if (c[1] == '0')
				n_font = o_font
			else if (c[1] >= '1' && c[1] <= '9')
				n_font = abc.get_font("u" + c[1])
			else
				return c
			c = ''
			if (n_font == c_font)
				return c
			if (c_font != o_font)
				c = "</span>";
			c_font = n_font
			if (c_font == o_font)
				return c
			if (c_font.class)
				return c + '<span class="' + c_font.class + '">'
			return c + '<span class="f' + c_font.fid + '">'
		}
	})
	if (c_font != o_font)
		txt += '</span>'
	return span + txt
} // para_build()

// output a text (called from write_text)
function write_xhtml(text, action) {
    var i, j, text2, skip

	abc.svg_flush();
	skip = abc.get_posy()		// handle %%vskip

	// output the XHTML header if not done yet
	if (!init_done)
		user.img_out('');

	o_font = c_font = abc.get_font("text")
	while (1) {
		i = text.indexOf('\n\n')
		if (i > 0) {
			text2 = text.slice(i + 2);
			text = text.slice(0, i)
		}
		text = para_build(text)
		switch (action) {
		default:		// left
//		case 'c':		// center
//		case 'r':		// right
			user.img_out(para_start(action, skip) +
				text.replace(/\n/g, '<br/>\n') + '</p>')
			break
		case 'f':		// fill
		case 'j':		// justify
			user.img_out(para_start(action, skip) + text + '</p>')
			break
		}
		if (i <= 0)
			break
		text = text2;
		skip = 0
	}
} // write_xhtml()

// replacement of Abc write_text()
function write_text(text, action) {
	if (action == 's')		// skip
		return
	if (!abc.get_multi())
		write_xhtml(text, action)
	else
		wto(text, action)
}

// entry point from cmdline
abc2svg.abc_init = function() {

	// output a header or footer
	function gen_hf(type, str) {
		var	a, i, page,
			lcr = ["left", "center", "right"];

		a = header_footer(str)
		for (i = 0; i < 3; i++) {
			str = a[i]
			if (!str)
				continue
			if (str.indexOf('\x0c') >= 0) {
				str = str.replace('\x0c', '');
				page = " page"
			} else {
				page = ''
			}
			abc2svg.print('<div class="' + type + ' ' + lcr[i] + page +
				'">' +
				str + '</div>')
		}
	}

	user.page_format = true;

	// output the xhtml header
	user.img_out = function(str) {
		var	header = abc.get_cfmt("header"),
			footer = abc.get_cfmt("footer"),
			topmargin = abc.get_cfmt("topmargin") || "1cm",
			botmargin = abc.get_cfmt("botmargin") || "1cm",
			media_s = '@media print {\n\
	body {margin:0; padding:0; border:0}\n\
	.newpage {page-break-before: always}\n\
	div.nobrk {page-break-inside: avoid}\n\
}',
			media_f ='@media screen {\n\
	div.header {display: none}\n\
	div.footer {display: none}\n\
}\n\
@media print {\n\
	body {margin:0; padding:0; border:0;\n\
		counter-reset: page;\n\
		counter-increment: page; }\n\
	.newpage {page-break-before: always}\n\
	div.nobrk {page-break-inside: avoid}\n\
	div.header {\n\
		position: fixed;\n\
		top: 0pt;\n\
		width: 100%;\n\
		' + abc.style_font(abc.get_cfmt("headerfont")) + '\n\
	}\n\
	div.footer {\n\
		position: fixed;\n\
		bottom: 0pt;\n\
		width: 100%;\n\
		' + abc.style_font(abc.get_cfmt("footerfont")) + '\n\
	}\n\
	div.page:after {\n\
		counter-increment: page;\n\
		content: counter(page);\n\
	}\n\
	div.left {text-align: left}\n\
	div.center {text-align: center}\n\
	div.right {text-align: right}\n\
}';

		abc2svg.print('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"\n\
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1.dtd">\n\
<html xmlns="http://www.w3.org/1999/xhtml">\n\
<head>\n\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>\n\
<meta name="generator" content="abc2svg-' + abc2svg.version + '"/>\n\
<!-- CreationDate: ' + get_date() + '-->\n\
<style type="text/css">\n\
svg {display:block}\n\
body {width:' + abc.get_cfmt("pagewidth").toFixed(0) +'px}\n\
p {' + set_pstyle() + 'margin-top:0}\n\
p span {line-height:' + ((abc.get_cfmt("lineskipfac") * 100) | 0).toString() + '%}\n' +
			((header || footer) ? media_f : media_s) + '\n\
@page{margin:' + topmargin + ' 0 ' + botmargin + ' 0}\n\
</style>\n\
<title>abc2svg document</title>\n\
</head>\n\
<body>')
		if (header)
			gen_hf("header", header)
		if (footer)
			gen_hf("footer", footer);

		// output the first generated string
		abc2svg.print(str);
		init_done = true;

		// change the output function
		user.img_out = function(str) { abc2svg.print(str) }
	}

	wto = abc.set_xhtml(write_text)		// switch write_text()
}

abc2svg.abc_end = function() {
    var	font_style = abc.get_font_style()

	if (!init_done)				// if empty document
		user.img_out('')
	if (user.errtxt)
		abc2svg.print("<pre>" + clean_txt(user.errtxt) + "</pre>")
	if (font_style)				// if some %%text at the end
		abc2svg.print('<style type="text/css">' + font_style + '\n</style>');
	abc2svg.print("</body>\n</html>")
}
