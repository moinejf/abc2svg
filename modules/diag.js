// diag.js - module to insert guitar chord diagrams
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%diagram" appears in a ABC source.
//
// Parameters
//	%%diagram 1

abc2svg.diag = {

// function called before tune generation
    do_diag: function(abc, voice_tb) {

	// create the decorations if not done yet
	if (!abc.glyphs['fb']) {
	    var	i, j, d,
		ns = "CDEFGAB",
		ms = ["", "m", "7", "m7", "maj7", "sus4"]

		for (i = 0; i < ns.length; i++) {
			for (j = 0; j < ms.length; j++) {
				d = ns[i] + ms[j];
				abc.decos[d] = "3 " + d + " 40 0 0"
			}
		}
		for (j = 0; j < ms.length; j++) {
			d = "F♯" + ms[j]
			abc.decos[d] = "3 F#" + ms[j] + " 40 0 0"
		}

	// add the glyphs (converted to SVG from Guido Gonzato PS)

	// fingerboard
		abc.glyphs['fb'] = '<g id="fb">\n\
<path class="stroke" stroke-width="0.4" d="\
M-10 -34h20m0 6h-20\
m0 6h20m0 6h-20\
m0 6h20"/>\n\
<path class="stroke" stroke-width="0.5" d="\
M-10 -34v24m4 0v-24\
m4 0v24m4 0v-24\
m4 0v24m4 0v-24"/>\n\
</g>';

// fret information
		abc.glyphs['nut'] =
			'<path id="nut" class="stroke" stroke-width="1.6" d="\
M-10.2 -34.5h20.4"/>';
		abc.glyphs['barre'] =
			'<path id="barre" class="stroke" stroke-width=".9" d="\
M-10.2 -31h20.4"/>';
		abc.glyphs['fr1'] =
			'<text id="fr1" x="-20" y="-29" class="frn">fr1</text>';
		abc.glyphs['fr2'] =
			'<text id="fr2" x="-20" y="-29" class="frn">fr2</text>';
		abc.glyphs['fr3'] =
			'<text id="fr3" x="-20" y="-29" class="frn">fr3</text>';
		abc.glyphs['ddot'] =
			'<circle id="ddot" class="fill" r="1.5"/>';

// chords
		abc.glyphs['C'] = '<g id="C">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-3,4" y="-36" class="diag">321</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Cm'] = '<g id="Cm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">342</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['C7'] = '<g id="C7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0,4" y="-36" class="diag">3241</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Cm7'] = '<g id="Cm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,4" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Cmaj7'] = '<g id="Cmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4" y="-36" class="diag">x21</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Csus4'] = '<g id="Csus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x34</text>\n\
<use x="6" y="-13" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['D'] = '<g id="D">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x132</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Dm'] = '<g id="Dm">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x231</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['D7'] = '<g id="D7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Dm7'] = '<g id="Dm7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx211</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Dmaj7'] = '<g id="Dmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Dsus4'] = '<g id="Dsus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['E'] = '<g id="E">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">231</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Em'] = '<g id="Em">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">23</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['E7'] = '<g id="E7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">21</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Em7'] = '<g id="Em7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">1</text>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Emaj7'] = '<g id="Emaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">312</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Esus4'] = '<g id="Esus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">12</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['F'] = '<g id="F">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Fm'] = '<g id="Fm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F7'] = '<g id="F7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Fm7'] = '<g id="Fm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Fmaj7'] = '<g id="Fmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Fsus4'] = '<g id="Fsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['F#'] = '<g id="F#">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F#m'] = '<g id="F#m">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F#7'] = '<g id="F#7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F#m7'] = '<g id="F#m7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F#maj7'] = '<g id="F#maj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['F#sus4'] = '<g id="F#sus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['G'] = '<g id="G">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">234</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Gm'] = '<g id="Gm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['G7'] = '<g id="G7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">321</text>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Gm7'] = '<g id="Gm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Gmaj7'] = '<g id="Gmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Gsus4'] = '<g id="Gsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['A'] = '<g id="A">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Am'] = '<g id="Am">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">231</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['A7'] = '<g id="A7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">23</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Am7'] = '<g id="Am7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">21</text>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
	abc.glyphs['Amaj7'] = '<g id="Amaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x213</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Asus4'] = '<g id="Asus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x12</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		abc.glyphs['B'] = '<g id="B">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Bm'] = '<g id="Bm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">341</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['B7'] = '<g id="B7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4,0,8" y="-36" class="diag">x2134</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Bm7'] = '<g id="Bm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,8" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Bmaj7'] = '<g id="Bmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x324</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		abc.glyphs['Bsus4'] = '<g id="Bsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x34</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>'
	}

    var	s, i, gch, t

	for (s = voice_tb[0].sym; s; s = s.next) {
		if (!s.a_gch)
			continue
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (!gch || gch.type != 'g' || gch.capo)
				continue

			t = gch.otext || gch.text

			// insert the diagram as a decoration
			abc.deco_cnv(t.split(/[ \t/]/, 1), s, null)
		}
	}
    } // do_diag()
} // diag

// inject code inside the core
abc2svg.inject += '\
var diag = {\n\
	om: output_music,\n\
	set_fmt: set_format\n\
}\n\
output_music = function() {\n\
	if (cfmt.diag)\n\
		abc2svg.diag.do_diag(self, voice_tb)\n\
	diag.om()\n\
}\n\
set_format = function(cmd, param, lock) {\n\
	if (cmd == "diagram") {\n\
		cfmt.diag = param\n\
		return\n\
	}\n\
	diag.set_fmt(cmd, param, lock)\n\
}\n\
\
style += "\\n.diag {font-family:sansserif;font-size:6px}\
\\n.frn {font-family:sansserif;font-style:italic;font-size:7px}"\n\
'

// the module is loaded
abc2svg.modules.diagram.loaded = true
