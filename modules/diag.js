// diag.js - module to insert guitar chord diagrams
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%diagram" appears in a ABC source.
//
// Parameters
//	%%diagram 1

function Diag(i_abc) {
    var	abc = i_abc

// function called before tune generation
Diag.prototype.do_diag = function(voice_tb) {
    var	s, i, gch, dd

	for (s = voice_tb[0].sym; s; s = s.next) {
		if (!s.a_gch)
			continue
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (!gch || gch.type != 'g')
				continue

			// insert the diagram as a decoration
			abc.deco_cnv(gch.text.split(/[ \t/]/, 1), s, null)
		}
	}
    } // do_diag()

// Diagram creation

	//export some functions/variables
	abc.tosvg('diag', '\
%%beginjs\n\
Abc.prototype.add_glyph = function(k, v) { glyphs[k] = v }\n\
Abc.prototype.deco_cnv = deco_cnv\n\
Abc.prototype.get_cfmt = function(k) { return cfmt[k] }\n\
Abc.prototype.get_top_v = function() { return par_sy.top_voice }\n\
\
var diag = {\n\
	om: output_music,\n\
	set_fmt: set_format\n\
}\n\
output_music = function() {\n\
	if (cfmt.diag)\n\
		Diag.prototype.do_diag(voice_tb)\n\
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
%%endjs\n\
\
%%deco C     3 C     40 0 0\n\
%%deco Cm    3 Cm    40 0 0\n\
%%deco C7    3 C7    40 0 0\n\
%%deco Cm7   3 Cm7   40 0 0\n\
%%deco Cmaj7 3 Cmaj7 40 0 0\n\
%%deco Csus4 3 Csus4 40 0 0\n\
\
%%deco D     3 D     40 0 0\n\
%%deco Dm    3 Dm    40 0 0\n\
%%deco D7    3 D7    40 0 0\n\
%%deco Dm7   3 Dm7   40 0 0\n\
%%deco Dmaj7 3 Dmaj7 40 0 0\n\
%%deco Dsus4 3 Dsus4 40 0 0\n\
\
%%deco E     3 E     40 0 0\n\
%%deco Em    3 Em    40 0 0\n\
%%deco E7    3 E7    40 0 0\n\
%%deco Em7   3 Em7   40 0 0\n\
%%deco Emaj7 3 Emaj7 40 0 0\n\
%%deco Esus4 3 Esus4 40 0 0\n\
\
%%deco F     3 F     40 0 0\n\
%%deco Fm    3 Fm    40 0 0\n\
%%deco F7    3 F7    40 0 0\n\
%%deco Fm7   3 Fm7   40 0 0\n\
%%deco Fmaj7 3 Fmaj7 40 0 0\n\
%%deco Fsus4 3 Fsus4 40 0 0\n\
\
%%deco F♯     3 F#     40 0 0\n\
%%deco F♯m    3 F#m    40 0 0\n\
%%deco F♯7    3 F#7    40 0 0\n\
%%deco F♯m7   3 F#m7   40 0 0\n\
%%deco F♯maj7 3 F#maj7 40 0 0\n\
%%deco F♯sus4 3 F#sus4 40 0 0\n\
\
%%deco G     3 G     40 0 0\n\
%%deco Gm    3 Gm    40 0 0\n\
%%deco G7    3 G7    40 0 0\n\
%%deco Gm7   3 Gm7   40 0 0\n\
%%deco Gmaj7 3 Gmaj7 40 0 0\n\
%%deco Gsus4 3 Gsus4 40 0 0\n\
\
%%deco A     3 A     40 0 0\n\
%%deco Am    3 Am    40 0 0\n\
%%deco A7    3 A7    40 0 0\n\
%%deco Am7   3 Am7   40 0 0\n\
%%deco Amaj7 3 Amaj7 40 0 0\n\
%%deco Asus4 3 Asus4 40 0 0\n\
\
%%deco B     3 B     40 0 0\n\
%%deco Bm    3 Bm    40 0 0\n\
%%deco B7    3 B7    40 0 0\n\
%%deco Bm7   3 Bm7   40 0 0\n\
%%deco Bmaj7 3 Bmaj7 40 0 0\n\
%%deco Bsus4 3 Bsus4 40 0 0\n\
')

// add the glyphs (converted to SVG from Guido Gonzato PS)

// fingerboard
abc.add_glyph('fb', '<g id="fb">\n\
<path class="stroke" stroke-width="0.4" d="\
M-10 -34h20m0 6h-20\
m0 6h20m0 6h-20\
m0 6h20"/>\n\
<path class="stroke" stroke-width="0.5" d="\
M-10 -34v24m4 0v-24\
m4 0v24m4 0v-24\
m4 0v24m4 0v-24"/>\n\
</g>\
');

// fret information
abc.add_glyph('nut','<path id="nut" class="stroke" stroke-width="1.6" d="\
M-10.2 -34.5h20.4"/>');
abc.add_glyph('barre','<path id="barre" class="stroke" stroke-width=".9" d="\
M-10.2 -31h20.4"/>');
abc.add_glyph('fr1','<text id="fr1" x="-20" y="-29" class="frn">fr1</text>');
abc.add_glyph('fr2','<text id="fr2" x="-20" y="-29" class="frn">fr2</text>');
abc.add_glyph('fr3','<text id="fr3" x="-20" y="-29" class="frn">fr3</text>');
abc.add_glyph('ddot','<circle id="ddot" class="fill" r="1.5"/>');

// chords
abc.add_glyph('C', '<g id="C">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-3,4" y="-36" class="diag">321</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Cm', '<g id="Cm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">342</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('C7', '<g id="C7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0,4" y="-36" class="diag">3241</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Cm7', '<g id="Cm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,4" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Cmaj7', '<g id="Cmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4" y="-36" class="diag">x21</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Csus4', '<g id="Csus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x34</text>\n\
<use x="6" y="-13" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('D', '<g id="D">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x132</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Dm', '<g id="Dm">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x231</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('D7', '<g id="D7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4,8" y="-36" class="diag">x312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Dm7', '<g id="Dm7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx211</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Dmaj7', '<g id="Dmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Dsus4', '<g id="Dsus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,0,4,8" y="-36" class="diag">xx123</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('E', '<g id="E">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">231</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Em', '<g id="Em">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">23</text>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('E7', '<g id="E7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">21</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Em7', '<g id="Em7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">1</text>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Emaj7', '<g id="Emaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">312</text>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Esus4', '<g id="Esus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">12</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('F', '<g id="F">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Fm', '<g id="Fm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F7', '<g id="F7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Fm7', '<g id="Fm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Fmaj7', '<g id="Fmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Fsus4', '<g id="Fsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr1"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('F#', '<g id="F#">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">342</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F#m', '<g id="F#m">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F#7', '<g id="F#7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,0" y="-36" class="diag">32</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F#m7', '<g id="F#m7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F#maj7', '<g id="F#maj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4,0" y="-36" class="diag">423</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('F#sus4', '<g id="F#sus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('G', '<g id="G">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">234</text>\n\
<use x="10" y="-19" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Gm', '<g id="Gm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8,-4" y="-36" class="diag">34</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('G7', '<g id="G7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">321</text>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="10" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Gm7', '<g id="Gm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-8" y="-36" class="diag">3</text>\n\
<use x="-6" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Gmaj7', '<g id="Gmaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,8" y="-36" class="diag">312</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-10" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Gsus4', '<g id="Gsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr3"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0" y="-36" class="diag">34</text>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('A', '<g id="A">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Am', '<g id="Am">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">231</text>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('A7', '<g id="A7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">23</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Am7', '<g id="Am7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,4" y="-36" class="diag">21</text>\n\
<use x="6" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Amaj7', '<g id="Amaj7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x213</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-31" xlink:href="#ddot"/>\n\
<use x="-2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Asus4', '<g id="Asus4">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x12</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');

abc.add_glyph('B', '<g id="B">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">234</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Bm', '<g id="Bm">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-4,0,4" y="-36" class="diag">341</text>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-19" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('B7', '<g id="B7">\n\
<use xlink:href="#nut"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-8,-4,0,8" y="-36" class="diag">x2134</text>\n\
<use x="10" y="-25" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-6" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-31" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Bm7', '<g id="Bm7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,8" y="-36" class="diag">x32</text>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
<use x="6" y="-25" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Bmaj7', '<g id="Bmaj7">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,-4,0,4" y="-36" class="diag">x324</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
<use x="-2" y="-19" xlink:href="#ddot"/>\n\
</g>\
');
abc.add_glyph('Bsus4', '<g id="Bsus4">\n\
<use xlink:href="#barre"/>\n\
<use xlink:href="#fr2"/>\n\
<use xlink:href="#fb"/>\n\
<text x="-12,0,4" y="-36" class="diag">x34</text>\n\
<use x="6" y="-19" xlink:href="#ddot"/>\n\
<use x="2" y="-25" xlink:href="#ddot"/>\n\
</g>\
');

} //Diag()
