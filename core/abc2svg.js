// abc2svg - abc2svg.js
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

// start of the Abc object
abc2svg.Abc = function(user) {
	"use strict";

	// mask some unsafe functions
    var	require = empty_function,
	system = empty_function,
	write = empty_function,
	XMLHttpRequest = empty_function;

	this.user = user

// -- constants --
// symbol types
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

// note heads
	FULL = 0,
	EMPTY = 1,
	OVAL = 2,
	OVALBARS = 3,
	SQUARE = 4,

/* slur/tie types (3 + 1 bits) */
	SL_ABOVE = 0x01,
	SL_BELOW = 0x02,
	SL_AUTO = 0x03,
	SL_HIDDEN = 0x04,
	SL_DOTTED = 0x08,		/* (modifier bit) */

// staff system
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

	BASE_LEN = 1536,
	IN = 96,		// resolution 96 PPI
	CM = 37.8,		// 1 inch = 2.54 centimeter
	YSTEP = 256		/* number of steps for y offsets */

// error texts
var errs = {
	bad_char: "Bad character '$1'",
	bad_val: "Bad value in $1",
	bar_grace: "Cannot have a bar in grace notes",
	ignored: "$1: inside tune - ignored",
	misplaced: "Misplaced '$1' in %%staves",
	must_note: "!$1! must be on a note",
	must_note_rest: "!$1! must be on a note or a rest",
	nonote_vo: "No note in voice overlay",
	not_enough_n: 'Not enough notes/rests for %%repeat',
	not_enough_m: 'Not enough measures for %%repeat',
	not_ascii: "Not an ASCII character"
}

var	glovar = {
		meter: {
			type: METER,		// meter in tune header
			wmeasure: 1,		// no M:
			a_meter: []		// default: none
		}
	},
	info = {},			// information fields
	mac = {},			// macros (m:)
	maci = new Int8Array(128),	// first letter of macros
	parse = {
		ctx: {},
		prefix: '%',
		state: 0,
		line: new scanBuf()
	},
	psvg			// PostScript

// utilities
function clone(obj, lvl) {
	if (!obj)
		return obj
	var tmp = new obj.constructor()
	for (var k in obj)
	    if (obj.hasOwnProperty(k)) {
		if (lvl && typeof obj[k] == 'object')
			tmp[k] = clone(obj[k], lvl - 1)
		else
			tmp[k] = obj[k]
	    }
	return tmp
}

function errbld(sev, txt, fn, idx) {
	var i, j, l, c, h

	if (user.errbld) {
		switch (sev) {
		case 0: sev = "warn"; break
		case 1: sev = "error"; break
		default: sev= "fatal"; break
		}
		user.errbld(sev, txt, fn, idx)
		return
	}
	if (idx != undefined && idx >= 0) {
		i = l = 0
		while (1) {
			j = parse.file.indexOf('\n', i)
			if (j < 0 || j > idx)
				break
			l++;
			i = j + 1
		}
		c = idx - i
	}
	h = ""
	if (fn) {
		h = fn
		if (l)
			h += ":" + (l + 1) + ":" + (c + 1);
		h += " "
	}
	switch (sev) {
	case 0: h += "Warning: "; break
	case 1: h += "Error: "; break
	default: h += "Internal bug: "; break
	}
	user.errmsg(h + txt, l, c)
}

function error(sev, s, msg, a1, a2, a3, a4) {
	var i, j, regex, tmp

	if (user.textrans) {
		tmp = user.textrans[msg]
		if (tmp)
			msg = tmp
	}
	if (arguments.length > 3)
		msg = msg.replace(/\$./g, function(a) {
			switch (a) {
			case '$1': return a1
			case '$2': return a2
			case '$3': return a3
			default  : return a4
			}
		})
	if (s && s.fname)
		errbld(sev, msg, s.fname, s.istart)
	else
		errbld(sev, msg)
}

// scanning functions
function scanBuf() {
//	this.buffer = buffer
	this.index = 0;

	scanBuf.prototype.char = function() {
		return this.buffer[this.index]
	}
	scanBuf.prototype.next_char = function() {
		return this.buffer[++this.index]
	}
	scanBuf.prototype.get_int = function() {
		var	val = 0,
			c = this.buffer[this.index]
		while (c >= '0' && c <= '9') {
			val = val * 10 + Number(c);
			c = this.next_char()
		}
		return val
	}
}

function syntax(sev, msg, a1, a2, a3, a4) {
    var	s = {
		fname: parse.fname,
		istart: parse.istart + parse.line.index
	}

	error(sev, s, msg, a1, a2, a3, a4)
}

// inject javascript code
function js_inject(js) {
	if (!/eval *\(|Function|setTimeout|setInterval/.test(js))
		eval('"use strict"\n' + js)
	else
		syntax(1, "Unsecure code")
}
