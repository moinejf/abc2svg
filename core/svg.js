// abc2svg - svg.js - svg functions
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

var	output = "",		// output buffer
	style = '\n.fill {fill: currentColor}\
\n.stroke {stroke: currentColor; fill: none}\
\n.music text, .music tspan {fill:currentColor}',
	font_style = '',
	posx = cfmt.leftmargin / cfmt.scale,	// default x offset of the images
	posy = 0,		// y offset in the block
	img = {			// image
		width: cfmt.pagewidth,	// width
		lm: cfmt.leftmargin,	// left and right margins
		rm: cfmt.rightmargin
//		chg: false
	},
	defined_glyph = {},
	defs = '',
	fulldefs = '',		// unreferenced defs as <filter>
	stv_g = {		/* staff/voice graphic parameters */
		scale: 1,
		dy: 0,
		st: -1,
		v: 0,
		g: 0
//		color: undefined
	},
	block = {}		/* started & newpage */

// glyphs in music font
var tgls = {
  brace: {x:0, y:0, c:"\ue000"},
  sgno: {x:-6, y:4, c:"\ue047"},
  coda: {x:-12, y:6, c:"\ue048"},
  tclef: {x:-8, y:0, c:"\ue050"},
  cclef: {x:-8, y:0, c:"\ue05c"},
  bclef: {x:-8, y:0, c:"\ue062"},
  pclef: {x:-6, y:0, c:"\ue069"},
  stclef: {x:-8, y:0, c:"\ue07a"},
  scclef: {x:-8, y:0, c:"\ue07b"},
  sbclef: {x:-7, y:0, c:"\ue07c"},
  meter0: {c:"\ue080"},
  meter1: {c:"\ue081"},
  meter2: {c:"\ue082"},
  meter3: {c:"\ue083"},
  meter4: {c:"\ue084"},
  meter5: {c:"\ue085"},
  meter6: {c:"\ue086"},
  meter7: {c:"\ue087"},
  meter8: {c:"\ue088"},
  meter9: {c:"\ue089"},
  "meter+": {c:"\ue08c"},
  "meter(": {c:"\ue094"},
  "meter)": {c:"\ue095"},
  csig: {x:0, y:0, c:"\ue08a"},
  ctsig: {x:0, y:0, c:"\ue08b"},
  HDD: {x:-7, y:0, c:"\ue0a0"},
  breve: {x:-6, y:0, c:"\ue0a1"},
  HD: {x:-5.2, y:0, c:"\ue0a2"},
  Hd: {x:-3.8, y:0, c:"\ue0a3"},
  hd: {x:-3.7, y:0, c:"\ue0a4"},
  ghd: {x:2, y:0, c:"\ue0a4", sc:.66},
  pshhd: {x:-3.7, y:0, c:"\ue0a9"},
  pfthd: {x:-3.7, y:0, c:"\ue0b3"},
  x: {x:-3.7, y:0, c:"\ue0a9"},
  "circle-x": {x:-3.7, y:0, c:"\ue0b3"},
  srep: {x:-5, y:0, c:"\ue101"},
  dot: {x:-2, y:0, c:"\ue1e7"},
 "acc-1": {x:-3, y:0, c:"\ue260"},
  acc3: {x:-2, y:0, c:"\ue261"},
  acc1: {x:-3, y:0, c:"\ue262"},
  acc2: {x:-3, y:0, c:"\ue263"},
 "acc-2": {x:-3, y:0, c:"\ue264"},
 "acc-1_1_4": {x:-3, y:0, c:"\ue280"},
  accent: {x:-3, y:0, c:"\ue4a0"},
  marcato: {x:-3, y:0, c:"\ue4ac"},
  hld: {x:-7, y:0, c:"\ue4c0"},
  brth: {x:0, y:0, c:"\ue4ce"},
  r00: {x:-1.5, y:0, c:"\ue4e1"},
  r0: {x:-1.5, y:0, c:"\ue4e2"},
  r1: {x:-3.5, y:6, c:"\ue4e3"},
  r2: {x:-3.2, y:0, c:"\ue4e4"},
  r4: {x:-3, y:0, c:"\ue4e5"},
  r8: {x:-3, y:0, c:"\ue4e6"},
  r16: {x:-4, y:0, c:"\ue4e7"},
  r32: {x:-4, y:0, c:"\ue4e8"},
  r64: {x:-4, y:0, c:"\ue4e9"},
  r128: {x:-4, y:0, c:"\ue4ea"},
  mrest: {x:-10, y:0, c:"\ue4ee"},
  mrep: {x:-6, y:0, c:"\ue500"},
  mrep2: {x:-9, y:0, c:"\ue501"},
  turn: {x:-5, y:4, c:"\ue567"},
  turnx: {x:-5, y:4, c:"\ue569"},
  umrd: {x:-7, y:2, c:"\ue56c"},
  lmrd: {x:-7, y:2, c:"\ue56d"},
  ped: {x:-10, y:0, c:"\ue650"},
  pedoff: {x:-5, y:0, c:"\ue655"},
  longa: {x:-6, y:0, c:"\ue95c"}
}

// glyphs to put in <defs>
var glyphs = {
  acc1_1_4: '<g id="acc1_1_4">\n\
	<path d="m0 7.8v-15.4" class="stroke"/>\n\
	<path class="fill" d="M-1.8 2.7l3.6 -1.1v2.2l-3.6 1.1v-2.2z\n\
		M-1.8 -3.7l3.6 -1.1v2.2l-3.6 1.1v-2.2"/>\n\
</g>',
  acc1_3_4: '<g id="acc1_3_4">\n\
	<path d="m-2.5 8.7v-15.4M0 7.8v-15.4M2.5 6.9v-15.4" class="stroke"/>\n\
	<path class="fill" d="m-3.7 3.1l7.4 -2.2v2.2l-7.4 2.2v-2.2z\n\
		M-3.7 -3.2l7.4 -2.2v2.2l-7.4 2.2v-2.2"/>\n\
</g>',
 "acc-1_3_4": '<g id="acc-1_3_4">\n\
    <path class="fill" d="m0.6 -2.7\n\
	c-5.7 -3.1 -5.7 3.6 0 6.7c-3.9 -4 -4 -7.6 0 -5.8\n\
	M1 -2.7c5.7 -3.1 5.7 3.6 0 6.7c3.9 -4 4 -7.6 0 -5.8"/>\n\
    <path d="m1.6 3.5v-13M0 3.5v-13" class="stroke" stroke-width=".6"/>\n\
</g>',
  pmsig: '<path id="pmsig" class="stroke" stroke-width="0.8"\n\
	d="m0 -7a5 5 0 0 1 0 -10a5 5 0 0 1 0 10"/>',
  pMsig: '<g id="pMsig">\n\
	<use xlink:href="#pmsig"/>\n\
	<path class="fill" d="m0 -10a2 2 0 0 1 0 -4a2 2 0 0 1 0 4"/>\n\
</g>',
  imsig: '<path id="imsig" class="stroke" stroke-width="0.8"\n\
	d="m3 -8a5 5 0 1 1 0 -8"/>',
  iMsig: '<g id="iMsig">\n\
	<use xlink:href="#imsig"/>\n\
	<path class="fill" d="m0 -10a2 2 0 0 1 0 -4a2 2 0 0 1 0 4"/>\n\
</g>',
  hl: '<path id="hl" class="stroke" stroke-width="1" d="m-6 0h12"/>',
  hl1: '<path id="hl1" class="stroke" stroke-width="1" d="m-7 0h14"/>',
  hl2: '<path id="hl2" class="stroke" stroke-width="1" d="m-9 0h18"/>',
  ghl: '<path id="ghl" class="stroke" d="m-3.5 0h7"/>',
  rdots: '<g id="rdots" class="fill">\n\
	<circle cx="0" cy="-9" r="1.2"/>\n\
	<circle cx="0" cy="-15" r="1.2"/>\n\
</g>',
  grm: '<path id="grm" class="fill" d="m-5 -2.5\n\
	c5 -8.5 5.5 4.5 10 -2 -5 8.5 -5.5 -4.5 -10 2"/>',
  stc: '<circle id="stc" class="fill" cx="0" cy="-3" r="1.2"/>',
  sld: '<path id="sld" class="fill" d="m-7.2 4.8\n\
	c1.8 .7 4.5 -.2 7.2 -4.8 -2.1 5 -5.4 6.8 -7.6 6"/>',
  emb: '<path id="emb" class="stroke" stroke-width="1.2" stroke-linecap="round"\n\
	d="m-2.5 -3h5"/>',
  roll: '<path id="roll" class="fill" d="m-6 0\n\
	c0.4 -7.3 11.3 -7.3 11.7 0 -1.3 -6 -10.4 -6 -11.7 0"/>',
  upb: '<path id="upb" class="stroke" d="m-2.6 -9.4\n\
	l2.6 8.8 2.6 -8.8"/>',
  dnb: '<g id="dnb">\n\
	<path d="M-3.2 -2v-7.2m6.4 0v7.2" class="stroke"/>\n\
	<path d="M-3.2 -6.8v-2.4l6.4 0v2.4" class="fill"/>\n\
</g>',
  dplus: '<path id="dplus" class="stroke" stroke-width="1.7"\n\
	d="m0 -.5v-6m-3 3h6"/>',
  lphr: '<path id="lphr" class="stroke" stroke-width="1.2"\n\
	d="m0 0v18"/>',
  mphr: '<path id="mphr" class="stroke" stroke-width="1.2"\n\
	d="m0 0v12"/>',
  sphr: '<path id="sphr" class="stroke" stroke-width="1.2"\n\
	d="m0 0v6"/>',
  sfz: '<text id="sfz" x="-5" y="-7" \
style="font-family:serif; font-style:italic; font-size:14px">\n\
	s<tspan font-size="16" font-weight="bold">f</tspan>z</text>',
  trl: '<text id="trl" x="-2" y="-4"\n\
	style="font-family:serif; font-weight:bold; \
font-style:italic; font-size:16px">tr</text>',
  opend: '<circle id="opend" class="stroke"\n\
	cx="0" cy="-3" r="2.5"/>',
  snap: '<path id="snap" class="stroke" d="m-3 -6\n\
	c0 -5 6 -5 6 0 0 5 -6 5 -6 0\n\
	M0 -5v6"/>',
  thumb: '<path id="thumb" class="stroke" d="m-2.5 -7\n\
	c0 -6 5 -6 5 0 0 6 -5 6 -5 0\n\
	M-2.5 -9v4"/>',
  wedge: '<path id="wedge" class="fill" d="m0 -1l-1.5 -5h3l-1.5 5"/>',
  ltr: '<path id="ltr" class="fill"\n\
	d="m0 -.4c2 -1.5 3.4 -1.9 3.9 .4 0.2 .8 .7 .7 2.1 -.4\n\
	v0.8c-2 1.5 -3.4 1.9 -3.9 -.4 -.2 -.8 -.7 -.7 -2.1 .4z"/>',
  custos: '<g id="custos">\n\
	<path class="fill" d="m-4 0l2 2.5 2 -2.5 2 2.5 2 -2.5\n\
		-2 -2.5 -2 2.5 -2 -2.5 -2 2.5"/>\n\
	<path class="stroke" d="m3.5 0l5 -7"/>\n\
</g>',
  triangle: '<path id="triangle" class="fill" d="m-3.7 -3.2l7.4 0 -3.7 6.4 -3.7 -6.4"/>',
  diamond: '<path id="diamond" class="fill" d="m0 3.5l-3.7 -3.5 3.7 -3.5 3.7 3.5z"/>',
  oct: '<text id="oct" style="font-family:serif; font-size:12px">8</text>'
}

// mark a glyph as used and add it in <defs>
function def_use(gl) {
	var	i, j, g

	if (defined_glyph[gl])
		return
	defined_glyph[gl] = true;
	g = glyphs[gl]
	if (!g) {
//throw new Error("unknown glyph: " + gl)
		error(1, null, "Unknown glyph: '$1'", gl)
		return	// fixme: the xlink is set
	}
	j = 0
	while (1) {
		i = g.indexOf('xlink:href="#', j)
		if (i < 0)
			break
		i += 13;
		j = g.indexOf('"', i);
		def_use(g.slice(i, j))
	}
	defs += '\n' + g
}

// add user defs from %%beginsvg
function defs_add(text) {
	var	i, j, gl, tag, is,
		ie = 0

	// remove XML comments
	text = text.replace(/<!--.*?-->/g, '')

	while (1) {
		is = text.indexOf('<', ie);
		if (is < 0)
			break
		i = text.indexOf('id="', is)
		if (i < 0)
			break
		i += 4;
		j = text.indexOf('"', i);
		if (j < 0)
			break
		gl = text.slice(i, j);
		ie = text.indexOf('>', j);
		if (ie < 0)
			break
		if (text[ie - 1] == '/') {
			ie++
		} else {
			i = text.indexOf(' ', is);
			if (i < 0)
				break
			tag = text.slice(is + 1, i);
			ie = text.indexOf('</' + tag + '>', ie)
			if (ie < 0)
				break
			ie += 3 + tag.length
		}
		if (text.substr(is, 7) == '<filter')
			fulldefs += '\n' + text.slice(is, ie)
		else
			glyphs[gl] = text.slice(is, ie)
	}
}

// output the stop/start of a graphic sequence
function set_g() {

	// close the previous sequence
	if (stv_g.started) {
		stv_g.started = false;
		output += "</g>\n"
	}

	// check if new sequence needed
	if (stv_g.scale == 1 && !stv_g.color)
		return

	// open the new sequence
	output += '<g '
	if (stv_g.scale != 1) {
		if (stv_g.st >= 0)
			output += staff_tb[stv_g.st].scale_str
		else
			output += voice_tb[stv_g.v].scale_str
	}
	if (stv_g.color) {
		if (stv_g.scale != 1)
			output += ' ';
		output += 'style="color:' + stv_g.color + '"'
	}
	output += ">\n";
	stv_g.started = true
}

/* set the color */
function set_color(color) {
	if (color == stv_g.color)
		return undefined	// same color
	var	old_color = stv_g.color;
	stv_g.color = color;
	set_g()
	return old_color
}

/* -- set the staff scale (only) -- */
function set_sscale(st) {
	var	new_scale, dy

	if (st != stv_g.st && stv_g.scale != 1)
		stv_g.scale = 0;
	new_scale = st >= 0 ? staff_tb[st].staffscale : 1
	if (st >= 0 && new_scale != 1)
		dy = staff_tb[st].y
	else
		dy = posy
	if (new_scale == stv_g.scale && dy == stv_g.dy)
		return
	stv_g.scale = new_scale;
	stv_g.dy = dy;
	stv_g.st = st;
	set_g()
}

/* -- set the voice or staff scale -- */
function set_scale(s) {
	var	new_scale = s.p_v.scale

	if (new_scale == 1) {
		set_sscale(s.st)
		return
	}
/*fixme: KO when both staff and voice are scaled */
	if (new_scale == stv_g.scale && stv_g.dy == posy)
		return
	stv_g.scale = new_scale;
	stv_g.dy = posy;
	stv_g.st = -1;
	stv_g.v = s.v;
	set_g()
}

// -- set the staff output buffer and scale when delayed output
function set_dscale(st, no_scale) {
	if (output) {
		if (stv_g.st < 0) {
			staff_tb[0].output += output
		} else if (stv_g.scale == 1) {
			staff_tb[stv_g.st].output += output
		} else {
			staff_tb[stv_g.st].sc_out += output
		}
		output = ""
	}
	if (st < 0)
		stv_g.scale = 1
	else
		stv_g.scale = no_scale ? 1 : staff_tb[st].staffscale;
	stv_g.st = st;
	stv_g.dy = 0
}

// update the y offsets of delayed output
function delayed_update() {
	var st, new_out, text

	for (st = 0; st <= nstaff; st++) {
		if (staff_tb[st].sc_out) {
			output += '<g transform="translate(0,' +
					(posy - staff_tb[st].y).toFixed(2) +
					') scale(' +
					 staff_tb[st].staffscale.toFixed(2) +
					')">\n' +
				staff_tb[st].sc_out +
				'</g>\n';
			staff_tb[st].sc_out = ""
		}
		if (!staff_tb[st].output)
			continue
		output += '<g transform="translate(0,' +
				(-staff_tb[st].y).toFixed(2) +
				')">\n' +
			staff_tb[st].output +
			'</g>\n';
		staff_tb[st].output = ""
	}
}

// output the annotations
// !! tied to the symbol types in abc2svg.js !!
var anno_type = ['bar', 'clef', 'custos', '', 'grace',
		'key', 'meter', 'Zrest', 'note', 'part',
		'rest', 'yspace', 'staves', 'Break', 'tempo',
		'', 'block', 'remark']

function anno_out(s, t, f) {
	if (s.istart == undefined)
		return
	var	type = s.type,
		h = s.ymx - s.ymn + 4,
		wl = s.wl || 2,
		wr = s.wr || 2

	if (s.grace)
		type = GRACE

	f(t || anno_type[type], s.istart, s.iend,
		s.x - wl - 2, staff_tb[s.st].y + s.ymn + h - 2,
		wl + wr + 4, h, s);
}

function a_start(s, t) {
	anno_out(s, t, user.anno_start)
}
function a_stop(s, t) {
	anno_out(s, t, user.anno_stop)
}
function empty_function() {
}
var	anno_start = user.anno_start ? a_start : empty_function,
	anno_stop = user.anno_stop ? a_stop : empty_function

// output a string with x, y, a and b
// In the string,
//	X and Y are replaced by scaled x and y
//	A and B are replaced by a and b as string
//	F and G are replaced by a and b as float
function out_XYAB(str, x, y, a, b) {
	x = sx(x);
	y = sy(y);
	output += str.replace(/X|Y|A|B|F|G/g, function(c) {
		switch (c) {
		case 'X': return x.toFixed(2)
		case 'Y': return y.toFixed(2)
		case 'A': return a
		case 'B': return b
		case 'F': return a.toFixed(2)
//		case 'G':
		default: return b.toFixed(2)
		}
		})
}

// open / close containers
function g_open(x, y, rot, sx, sy) {
	out_XYAB('<g transform="translate(X,Y', x, y);
	if (rot)
		output += ') rotate(' + rot.toFixed(2)
	if (sx) {
		if (sy)
			output += ') scale(' + sx.toFixed(2) +
						', ' + sy.toFixed(2)
		else
			output += ') scale(' + sx.toFixed(2)
	}
	output += ')">\n';
	stv_g.g++
}
function g_close() {
	stv_g.g--;
	output += '</g>\n'
}

// external SVG string
Abc.prototype.out_svg = function(str) { output += str }

// exported functions for the annotation
function sx(x) {
	if (stv_g.g)
		return x
	return (x + posx) / stv_g.scale
}
Abc.prototype.sx = sx
function sy(y) {
	if (stv_g.g)
		return y
	if (stv_g.scale == 1)
		return posy - y
	if (stv_g.st < 0)
		return (posy - y) / stv_g.scale	// voice scale
	return stv_g.dy - y			// staff scale
}
Abc.prototype.sy = sy;
Abc.prototype.sh = function(h) {
	if (stv_g.st < 0)
		return h / stv_g.scale
	return h
}
// for absolute X,Y coordinates
Abc.prototype.ax = function(x) { return x + posx }
Abc.prototype.ay = function(y) {
	if (stv_g.st < 0)
		return posy - y
	return posy + (stv_g.dy - y) * stv_g.scale - stv_g.dy
}
Abc.prototype.ah = function(h) {
	if (stv_g.st < 0)
		return h
	return h * stv_g.scale
}
// output scaled (x + <sep> + y)
function out_sxsy(x, sep, y) {
	x = sx(x);
	y = sy(y);
	output += x.toFixed(2) + sep + y.toFixed(2)
}
Abc.prototype.out_sxsy = out_sxsy

// define the start of a path
function xypath(x, y, fill) {
	out_XYAB('<path class="A" d="mX Y\n', x, y, fill ? "fill" : "stroke")
}
Abc.prototype.xypath = xypath

// output a glyph
function xygl(x, y, gl) {
// (avoid ps<->js loop)
//	if (psxygl(x, y, gl))
//		return
	var 	tgl = tgls[gl]
	if (tgl && !glyphs[gl]) {
		x += tgl.x * stv_g.scale;
		y += tgl.y
		if (tgl.sc)
			out_XYAB('<text transform="translate(X,Y) scale(F)">B</text>\n',
				x, y, tgl.sc, tgl.c);
		else
			out_XYAB('<text x="X" y="Y">A</text>\n', x, y, tgl.c)
		return
	}
	if (!glyphs[gl]) {
		error(1, null, 'no definition of $1', gl)
		return
	}
	def_use(gl);
	out_XYAB('<use x="X" y="Y" xlink:href="#A"/>\n', x, y, gl)
}
// - specific functions -
// gua gda (acciaccatura)
function out_acciac(x, y, dx, dy, up) {
	if (up) {
		x -= 1;
		y += 4
	} else {
		x -= 5;
		y -= 4
	}
	out_XYAB('<path class="stroke" d="mX YlF G"/>\n',
		x, y, dx, -dy)
}
// simple /dotted measure bar
function out_bar(x, y, h, dotted) {
	output += '<path class="stroke" stroke-width="1" ' +
		(dotted ? 'stroke-dasharray="5,5" ' : '') +
		'd="m' + (x + posx).toFixed(2) +
		' ' + (posy - y).toFixed(2) + 'v' + (-h).toFixed(2) +
		'"/>\n'
}
// tuplet value - the staves are not defined
function out_bnum(x, y, str) {
	out_XYAB('<text style="font-family:serif; font-style:italic; font-size:12px"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
		x, y, str.toString())
}
// staff system brace
function out_brace(x, y, h) {
//fixme: '-6' depends on the scale
	x += posx - 6;
	y = posy - y;
	h /= 24;
	output += '<text transform="translate(' +
				x.toFixed(2) + ',' + y.toFixed(2) +
			') scale(2.5,' + h.toFixed(2) +
			')">' + tgls.brace.c + '</text>\n'
}

// staff system bracket
function out_bracket(x, y, h) {
	x += posx - 5;
	y = posy - y - 3;
	h += 2;
	output += '<path class="fill"\n\
	d="m' + x.toFixed(2) + ' ' + y.toFixed(2) + '\n\
	c10.5 1 12 -4.5 12 -3.5c0 1 -3.5 5.5 -8.5 5.5\n\
	v' + h.toFixed(2) + '\n\
	c5 0 8.5 4.5 8.5 5.5c0 1 -1.5 -4.5 -12 -3.5"/>\n'
}
// hyphen
function out_hyph(x, y, w) {
	var	n, a_y,
		d = 25 + ((w / 20) | 0) * 3

	if (w > 15.)
		n = ((w - 15) / d) | 0
	else
		n = 0;
	x += (w - d * n - 5) / 2;
	out_XYAB('<path class="stroke" stroke-width="1.2"\n\
	stroke-dasharray="5,A"\n\
	d="mX YhB"/>\n',
		x, y + 6,		// set the line a bit upper
		Math.round((d - 5) / stv_g.scale), d * n + 5)
}
// stem [and flags]
// fixme: h is already scaled - change that?
function out_stem(x, y, h, grace,
		  nflags, straight) {	// optional
//fixme: dx KO with half note or longa
	var	dx = grace ? GSTEM_XOFF : 3.5,
		slen = -h

	if (h < 0)
		dx = -dx;		// down
	x += dx * stv_g.scale
	if (stv_g.st < 0)
		slen /= stv_g.scale;
	out_XYAB('<path class="stroke" d="mX YvF"/>\n',	// stem
		x, y, slen)
	if (!nflags)
		return

	output += '<path class="fill"\n\
	d="';
	y += h
	if (h > 0) {				// up
		if (!straight) {
			if (!grace) {
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 5.6 9.6 9 5.6 18.4\n\
	1.6 -6 -1.3 -11.6 -5.6 -12.8\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc0.9 3.7 9.1 6.4 6 12.4\n\
	1 -5.4 -4.2 -8.4 -6 -8.4\n', x, y);
						y -= 5.4
					}
				}
			} else {		// grace
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 3.4 5.6 3.8 3 10\n\
	1.2 -4.4 -1.4 -7 -3 -7\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc1 3.2 5.6 2.8 3.2 8\n\
	1.4 -4.8 -2.4 -5.4 -3.2 -5.2\n', x, y);
						y -= 3.5
					}
				}
			}
		} else {			// straight
			if (!grace) {
//fixme: check endpoints
				y += 1
				while (--nflags >= 0) {
					out_XYAB('MX Yl7 3.2 0 3.2 -7 -3.2z\n',
						x, y);
					y -= 5.4
				}
			} else {		// grace
				while (--nflags >= 0) {
					out_XYAB('MX Yl3 1.5 0 2 -3 -1.5z\n',
						x, y);
					y -= 3
				}
			}
		}
	} else {				// down
		if (!straight) {
			if (!grace) {
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 -5.6 9.6 -9 5.6 -18.4\n\
	1.6 6 -1.3 11.6 -5.6 12.8\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc0.9 -3.7 9.1 -6.4 6 -12.4\n\
	1 5.4 -4.2 8.4 -6 8.4\n', x, y);
						y += 5.4
					}
				}
			} else {		// grace
				if (nflags == 1) {
					out_XYAB('MX Yc0.6 -3.4 5.6 -3.8 3 -10\n\
	1.2 4.4 -1.4 7 -3 7\n', x, y)
				} else {
					while (--nflags >= 0) {
						out_XYAB('MX Yc1 -3.2 5.6 -2.8 3.2 -8\n\
	1.4 4.8 -2.4 5.4 -3.2 5.2\n', x, y);
						y += 3.5
					}
				}
			}
		} else {			// straight
			if (!grace) {
//fixme: check endpoints
				y += 1
				while (--nflags >= 0) {
					out_XYAB('MX Yl7 -3.2 0 -3.2 -7 3.2z\n',
						x, y);
					y += 5.4
				}
//			} else {		// grace
//--fixme: error?
			}
		}
	}
	output += '"/>\n'
}
// thick measure bar
function out_thbar(x, y, h) {
	x += posx + 1.5;
	y = posy - y;
	output += '<path class="stroke" stroke-width="3" d="m' +
		x.toFixed(2) + ' ' + y.toFixed(2) +
		'v' + (-h).toFixed(2) + '"/>\n'
}
// tremolo
function out_trem(x, y, ntrem) {
	out_XYAB('<path class="fill" d="mX Y\n\t', x - 4.5, y)
	while (1) {
		output += 'l9 -3v3l-9 3z'
		if (--ntrem <= 0)
			break
		output += 'm0 5.4'
	}
	output += '"/>\n'
}
// tuplet bracket - the staves are not defined
function out_tubr(x, y, dx, dy, up) {
	var	h = up ? -3 : 3;

	y += h;
	dx /= stv_g.scale;
	output += '<path class="stroke" d="m';
	out_sxsy(x, ' ', y);
	output += 'v' + h.toFixed(2) +
		'l' + dx.toFixed(2) + ' ' + (-dy).toFixed(2) +
		'v' + (-h).toFixed(2) + '"/>\n'
}
// tuplet bracket with number - the staves are not defined
function out_tubrn(x, y, dx, dy, up, str) {
    var	sw = str.length * 10,
	h = up ? -3 : 3;

	out_XYAB('<text style="font-family:serif; font-style:italic; font-size:12px"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
		x + dx / 2, y + dy / 2, str);
	dx /= stv_g.scale
	if (!up)
		y += 6;
	output += '<path class="stroke" d="m';
	out_sxsy(x, ' ', y);
	output += 'v' + h.toFixed(2) +
		'm' + dx.toFixed(2) + ' ' + (-dy).toFixed(2) +
		'v' + (-h).toFixed(2) + '"/>\n' +
		'<path class="stroke" stroke-dasharray="' +
		((dx - sw) / 2).toFixed(2) + ' ' + sw.toFixed(2) +
		'" d="m';
	out_sxsy(x, ' ', y - h);
	output += 'l' + dx.toFixed(2) + ' ' + (-dy).toFixed(2) + '"/>\n'

}
// underscore line
function out_wln(x, y, w) {
	out_XYAB('<path class="stroke" stroke-width="0.8" d="mX YhF"/>\n',
		x, y + 3, w)
}

// decorations with string
var deco_str_style = {
crdc:	{
		dx: 0,
		dy: 5,
		style: 'font-family:serif; font-style:italic; font-size:14px'
	},
dacs:	{
		dx: 0,
		dy: 3,
		style: 'font-family:serif; font-size:16px',
		anchor: ' text-anchor="middle"'
	},
fng:	{
		dx: 0,
		dy: 1,
		style: 'font-family:Bookman; font-size:8px',
		anchor: ' text-anchor="middle"'
	},
pf:	{
		dx: 0,
		dy: 5,
		style: 'font-family:serif; font-weight:bold; font-style:italic; font-size:16px'
	},
'@':	{
		dx: 0,
		dy: 5,
		style: 'font-family:sans-serif; font-size:12px'
	}
}

function out_deco_str(x, y, name, str) {
	var	a, f,
		a_deco = deco_str_style[name]

	if (!a_deco) {
		xygl(x, y, name)
		return
	}
	x += a_deco.dx;
	y += a_deco.dy;
	if (!a_deco.def) {
		style += "\n." + name + " {" + a_deco.style + "}";
		a_deco.def = true
	}
	out_XYAB('<text x="X" y="Y" class="A"B>', x, y,
		name, a_deco.anchor || "");
	set_font("annotation");
	out_str(str);
	output += '</text>\n'
}

function out_arp(x, y, val) {
	g_open(x, y, 270);
	x = 0;
	y = -4;
	val = Math.ceil(val / 6)
	while (--val >= 0) {
		xygl(x, y, "ltr");
		x += 6
	}
	g_close()
}
function out_cresc(x, y, val, defl) {
	x += val;
	val = -val;
	out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val)
	if (defl.nost)
		output += '-2.2m0 -3.6l' + (-val).toFixed(2) + ' -2.2"/>\n'
	else
		output += '-4l' + (-val).toFixed(2) + ' -4"/>\n'

}
function out_dim(x, y, val, defl) {
	out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val)
	if (defl.noen)
		output += '-2.2m0 -3.6l' + (-val).toFixed(2) + ' -2.2"/>\n'
	else
		output += '-4l' + (-val).toFixed(2) + ' -4"/>\n'
}
function out_ltr(x, y, val) {
	y += 4;
	val = Math.ceil(val / 6)
	while (--val >= 0) {
		xygl(x, y, "ltr");
		x += 6
	}
}
function out_8va(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font-family:serif; font-weight:bold; font-style:italic; font-size:12px">8\
<tspan dy="-4" style="font-size:10px">va</tspan></text>\n',
			x - 8, y);
		x += 12;
		val -= 12
	} else {
		val -= 5
	}
	y += 6;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhA"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
}
function out_8vb(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font-family:serif; font-weight:bold; font-style:italic; font-size:12px">8\
<tspan dy="-4" style="font-size:10px">vb</tspan></text>\n',
			x - 8, y);
		x += 4;
		val -= 4
	} else {
		val -= 5
	}
//	y -= 2;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhA"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
}
function out_15ma(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font-family:serif; font-weight:bold; font-style:italic; font-size:12px">15\
<tspan dy="-4" style="font-size:10px">ma</tspan></text>\n',
			x - 10, y);
		x += 20;
		val -= 20
	} else {
		val -= 5
	}
	y += 6;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhA"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y)
}
function out_15mb(x, y, val, defl) {
	if (!defl.nost) {
		out_XYAB('<text x="X" y="Y" \
style="font-family:serif; font-weight:bold; font-style:italic; font-size:12px">15\
<tspan dy="-4" style="font-size:10px">mb</tspan></text>\n',
			x - 10, y);
		x += 7;
		val -= 7
	} else {
		val -= 5
	}
//	y -= 2;
	out_XYAB('<path class="stroke" stroke-dasharray="6,6" d="mX YhA"/>\n',
		x, y, val)
	if (!defl.noen)
		out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y)
}
var deco_val_tb = {
	arp:	out_arp,
	cresc:	out_cresc,
	dim:	out_dim,
	ltr:	out_ltr,
	"8va":	out_8va,
	"8vb":	out_8vb,
	"15ma":	out_15ma,
	"15mb": out_15mb
}

function out_deco_val(x, y, name, val, defl) {
	if (deco_val_tb[name])
		deco_val_tb[name](x, y, val, defl)
	else
		error(1, null, "No function for decoration '$1'", name)
}

function out_glisq(x2, y2, de) {
	var	de1 = de.start,
		x1 = de1.x,
		y1 = de1.y + staff_tb[de1.st].y,
		ar = -Math.atan2(y2 - y1, x2 - x1),
		a = ar / Math.PI * 180,
		len = (x2 - x1) / Math.cos(ar);

	g_open(x1, y1, a);
	x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
	len = (len - x1 - 6) / 6 | 0
	if (len < 1)
		len = 1
	while (--len >= 0) {
		xygl(x1, 0, "ltr");
		x1 += 6
	}
	g_close()
}

function out_gliss(x2, y2, de) {
	var	de1 = de.start,
		x1 = de1.x,
		y1 = de1.y + staff_tb[de1.st].y,
		ar = -Math.atan2(y2 - y1, x2 - x1),
		a = ar / Math.PI * 180,
		len = (x2 - x1) / Math.cos(ar);

	g_open(x1, y1, a);
	x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
	len -= x1 + 8;
	xypath(x1, 0);
	output += 'l' + len.toFixed(2) + ' 0" stroke-width="1"/>\n';
	g_close()
}

var deco_l_tb = {
	glisq: out_glisq,
	gliss: out_gliss
}

function out_deco_long(x, y, de) {
	var	name = de.dd.glyph

	if (deco_l_tb[name])
		deco_l_tb[name](x, y, de)
	else
		error(1, null, "No function for decoration '$1'", name)
}

// update the vertical offset
function vskip(h) {
	posy += h
}

// create the SVG image of the block
function svg_flush() {
	if (multicol || !output || !user.img_out || posy == 0)
		return

    var	head = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	color="black" class="music" stroke-width=".7"',
	g = ''

	if (cfmt.bgcolor)
		head += ' style="background-color: ' + cfmt.bgcolor + '"';

	posy *= cfmt.scale

	if (user.imagesize) {
		head += '\n' +
			user.imagesize +
			' viewBox="0 0 ' + img.width.toFixed(0) + ' ' +
			 posy.toFixed(0) + '">\n'
	} else {
		head += '\n\twidth="' + img.width.toFixed(0) +
			'px" height="' + posy.toFixed(0) + 'px">\n'
	}

	if (style || font_style || musicfont) {
		head += '<style type="text/css">' + style + font_style
		if (musicfont) {
			if (musicfont.indexOf('(') > 0) {
				head += '\n\
.music {font-family: music; font-size: 24px; fill: currentColor}\n\
@font-face {\n\
  font-family: music;\n\
  src: ' + musicfont + '}';
			} else {
				head += '\n\
.music {font-family: '+ musicfont +'; font-size: 24px; fill: currentColor}'
			}
		}
		head += '\n</style>\n'
	}
	defs += fulldefs
	if (defs)
		head += '<defs>' + defs + '\n</defs>\n'

	// if %%pagescale != 1, do a global scale
	// (with a container: transform scale in <svg> does not work
	//	the same in all browsers)
	// the class is used to know that the container is global
	if (cfmt.scale != 1) {
		head += '<g class="g" transform="scale(' +
			cfmt.scale.toFixed(2) + ')">\n';
		g = '</g>\n'
	}

	if (psvg)			// if PostScript support
		psvg.ps_flush(true);	// + setg(0)

	user.img_out(head + output + g + "</svg>");
	output = ""

	font_style = ''
	if (cfmt.fullsvg) {
		defined_glyph = {}
		defined_font = {}
	} else {
		musicfont = '';
		style = '';
		fulldefs = ''
	}
	defs = '';
	posy = 0
}

// output a part of a block of images
function blk_out() {
	if (multicol || !user.img_out)
		return
	blk_flush()
	if (user.page_format && !block.started) {
		block.started = true
		if (block.newpage) {
			block.newpage = false;
			user.img_out('<div class="nobrk newpage">')
		} else {
			user.img_out('<div class="nobrk">')
		}
	}
}
Abc.prototype.blk_out = blk_out

// output the end of a block (or tune)
function blk_flush() {
	svg_flush()
	if (block.started) {
		block.started = false;
		user.img_out('</div>')
	}
}
Abc.prototype.blk_flush = blk_flush
