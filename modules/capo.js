// capo.js - module to add a capo chord line
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%capo" appears in a ABC source.
//
// Parameters
//	%%capo n	'n' is the capo fret number

function Capo(abc_i) {
    var abc_capo,
	abc = abc_i

// function called when setting a chord symbol on a music element
Capo.prototype.gch_capo = function(a_gch) {
    var	gch, gch2, i2,
	transp = abc.get_cfmt('capo'),
	i = 0

	while (1) {
		gch = a_gch[i++]
		if (!gch)
			return
		if (gch.type == 'g')
			break
	}
	gch2 = Object.create(gch);
	gch2.capo = false;		// (would be erased when setting gch)
	gch2.text = abc.gch_tr1(gch2.text, -transp)
	if (!abc_capo) {		// if start of tune
		abc_capo = true;
		gch2.text += "  (capo: " + transp.toString() + ")"
	}

	gch2.font = abc.get_font(abc.get_cfmt("capofont") ?
					"capo" : "annotation")
	a_gch.splice(i, 0, gch2)

	// set a mark in the first chord symbol for %%diagram
	gch.capo = true

} // gch_capo()

Capo.prototype.capo_reset = function() {
	abc_capo = false
}

// Capo creation

// inject code inside the core
abc2svg.inject += '\
var capo = {\n\
	gch_b: gch_build,\n\
	om: output_music,\n\
	set_fmt: set_format\n\
}\n\
gch_build = function(s) {\n\
	if (cfmt.capo && a_gch)\n\
		Capo.prototype.gch_capo(a_gch);\n\
	capo.gch_b(s)\n\
}\n\
output_music = function() {\n\
	Capo.prototype.capo_reset();\n\
	capo.om()\n\
}\n\
set_format = function(cmd, param, lock) {\n\
	if (cmd == "capo") {\n\
		cfmt.capo = param\n\
		return\n\
	}\n\
	capo.set_fmt(cmd, param, lock)\n\
}\n\
'
} // Capo()
