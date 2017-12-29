// abc2svg - toxhtml.js - SVG generation
//
// Copyright (C) 2014-2017 Jean-Francois Moine
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

function abort(e) {
	abc.blk_out();
	abc.blk_flush();
	if (errtxt)
		print("<pre>" + clean_txt(errtxt) + "</pre>");
	print("<pre>" + e.message + "\n*** Abort ***\n" + e.stack + "</pre>");
	print("</body> </html>");
	quit()
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
			for (j = 0; j < 3; j++) {
				if (r[j])
					r[j] += '<br/>'
				else
					r[j] = '<br/>'
			}
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
				r[j] += t
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
}

// entry point from cmdline
function abc_init() {

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
			print('<div class="' + type + ' ' + lcr[i] + page + '">' +
				str + '</div>')
		}
	}

	user.page_format = true;

	// output the xhtml header
	user.img_out = function(str) {
		var	header = abc.get_fmt("header"),
			footer = abc.get_fmt("footer"),
			topmargin = abc.get_fmt("topmargin") || "1cm",
			botmargin = abc.get_fmt("botmargin") || "1cm",
			media_s = '	@media print {\n\
		body {margin:' + topmargin + ' 0 ' + botmargin + ' 0; padding:0; border:0}\n\
		div.newpage {page-break-before: always}\n\
		div.nobrk {page-break-inside: avoid}\n\
	}',
			media_f ='	@media screen {\n\
		div.header {display: none}\n\
		div.footer {display: none}\n\
	}\n\
	@media print {\n\
		body {margin:' + topmargin + ' 0 ' + botmargin + ' 0; padding:0; border:0;\n\
			counter-reset: page;\n\
			counter-increment: page; }\n\
		div.newpage {page-break-before: always}\n\
		div.nobrk {page-break-inside: avoid}\n\
		div.header {\n\
			position: fixed;\n\
			top: 0pt;\n\
			width: 100%;\n\
			' + abc.style_font(abc.get_fmt("headerfont")) + '\n\
		}\n\
		div.footer {\n\
			position: fixed;\n\
			bottom: 0pt;\n\
			width: 100%;\n\
			' + abc.style_font(abc.get_fmt("footerfont")) + '\n\
		}\n\
		div.page:after {\n\
			counter-increment: page;\n\
			content: counter(page);\n\
		}\n\
		div.left {text-align: left}\n\
		div.center {text-align: center}\n\
		div.right {text-align: right}\n\
	}';

		print('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"\n\
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1.dtd">\n\
<html xmlns="http://www.w3.org/1999/xhtml">\n\
<head>\n\
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>\n\
<meta name="generator" content="abc2svg-' + abc2svg.version + '"/>\n\
<!-- CreationDate: ' + get_date() + '-->\n\
<style type="text/css">\n\
	svg {display:block}\n\
	p {line-height:100%;margin-top:0em;margin-bottom:0.5em}\n' +
			((header || footer) ? media_f : media_s) + '\n\
</style>\n\
<title>abc2svg document</title>\n\
</head>\n\
<body>')
		if (header)
			gen_hf("header", header)
		if (footer)
			gen_hf("footer", footer);

		// output the first generated string
		print(str);

		// change the output function
		user.img_out = function(str) { print(str) }
	}

	// define some functions in the Abc object
	abc.tosvg('toxhtml', "%%beginjs\n\
Abc.prototype.get_fmt = function(k) { return cfmt[k] }\n\
Abc.prototype.get_info = function(k) { return info[k] }\n\
Abc.prototype.get_fname = function() { return parse.ctx.fname }\n\
%%endjs\n")
}

function abc_end() {
//fixme: bad output if no output...
	if (errtxt)
		print("<pre>" + clean_txt(errtxt) + "</pre>")
	print("</body>\n</html>")
}

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abort = abort;
	exports.abc_init = abc_init;
	exports.abc_end = abc_end;
}
