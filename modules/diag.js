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
    do_diag: function() {
    var	glyphs = this.get_glyphs(),
	voice_tb = this.get_voice_tb()

	// create the decorations if not done yet
	if (!glyphs['fb']) {
	    var	i, j, d,
		decos = this.get_decos();
		ns = "CDEFGAB",
		ms = ["", "m", "7", "m7", "maj7", "sus4"]

		this.add_style("\
\n.diag {font:6px sans-serif}\
\n.frn {font:italic 7px sans-serif}")

		for (i = 0; i < ns.length; i++) {
			for (j = 0; j < ms.length; j++) {
				d = ns[i] + ms[j];
				decos[d] = "3 " + d + " 40 0 0"
			}
		}
		for (j = 0; j < ms.length; j++) {
			d = "F♯" + ms[j]
			decos[d] = "3 F#" + ms[j] + " 40 0 0"
		}

	// add the glyphs (converted to SVG from Guido Gonzato PS)

	// fingerboard
		glyphs['fb'] = '<g id="fb">\n\
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
		glyphs['nut'] =
			'<path id="nut" class="stroke" stroke-width="1.6" d="\
M-10.2 -34.5h20.4"/>';
		glyphs['barre'] =
			'<path id="barre" class="stroke" stroke-width=".9" d="\
M-10.2 -31h20.4"/>';
		glyphs['fr1'] =
			'<text id="fr1" x="-20" y="-29" class="frn">fr1</text>';
		glyphs['fr2'] =
			'<text id="fr2" x="-20" y="-29" class="frn">fr2</text>';
		glyphs['fr3'] =
			'<text id="fr3" x="-20" y="-29" class="frn">fr3</text>';
		glyphs['ddot'] =
			'<circle id="ddot" class="fill" r="1.5"/>';

// chords
		glyphs['C'] = '<g id="C">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-3,4" y="-36" class="diag">321</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Cm'] = '<g id="Cm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">342</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['C7'] = '<g id="C7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0,4" y="-36" class="diag">3241</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Cm7'] = '<g id="Cm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,4" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Cmaj7'] = '<g id="Cmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4" y="-36" class="diag">x21</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Csus4'] = '<g id="Csus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x34</text>\n\
<use x="6" y="-13" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		glyphs['D'] = '<g id="D">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x132</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Dm'] = '<g id="Dm">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x231</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['D7'] = '<g id="D7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Dm7'] = '<g id="Dm7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx211</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Dmaj7'] = '<g id="Dmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Dsus4'] = '<g id="Dsus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		glyphs['E'] = '<g id="E">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">231</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Em'] = '<g id="Em">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">23</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['E7'] = '<g id="E7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">21</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Em7'] = '<g id="Em7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">1</text>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Emaj7'] = '<g id="Emaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">312</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Esus4'] = '<g id="Esus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">12</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		glyphs['F'] = '<g id="F">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Fm'] = '<g id="Fm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F7'] = '<g id="F7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Fm7'] = '<g id="Fm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Fmaj7'] = '<g id="Fmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Fsus4'] = '<g id="Fsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		glyphs['F#'] = '<g id="F#">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F#m'] = '<g id="F#m">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F#7'] = '<g id="F#7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F#m7'] = '<g id="F#m7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F#maj7'] = '<g id="F#maj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['F#sus4'] = '<g id="F#sus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		glyphs['G'] = '<g id="G">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">234</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Gm'] = '<g id="Gm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['G7'] = '<g id="G7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">321</text>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Gm7'] = '<g id="Gm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Gmaj7'] = '<g id="Gmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Gsus4'] = '<g id="Gsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';

		glyphs['A'] = '<g id="A">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Am'] = '<g id="Am">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">231</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['A7'] = '<g id="A7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">23</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Am7'] = '<g id="Am7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">21</text>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
	glyphs['Amaj7'] = '<g id="Amaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x213</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Asus4'] = '<g id="Asus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x12</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>';

		glyphs['B'] = '<g id="B">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Bm'] = '<g id="Bm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">341</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['B7'] = '<g id="B7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4,0,8" y="-36" class="diag">x2134</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Bm7'] = '<g id="Bm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,8" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Bmaj7'] = '<g id="Bmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x324</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>';
		glyphs['Bsus4'] = '<g id="Bsus4">\n\
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
			this.deco_cnv(t.split(/[ \t/]/, 1), s, null)
		}
	}
    }, // do_diag()

    output_music: function(of) {
	if (this.cfmt().diag)
		abc2svg.diag.do_diag.call(this)
	of()
    },

    set_fmt: function(of, cmd, param, lock) {
	if (cmd == "diagram") {
		this.cfmt().diag = param
		return
	}
	of(cmd, param, lock)
    }
} // diag

abc2svg.modules.hooks.push(
// export
	"deco_cnv",
// hooks
	[ "output_music", "abc2svg.diag.output_music" ],
	[ "set_format", "abc2svg.diag.set_fmt" ]
);

// the module is loaded
abc2svg.modules.diagram.loaded = true
