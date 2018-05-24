// perc.js - module to handle %%percmap
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%percmap" appears in a ABC source.
//
// Parameters (from W. Vree)
//	%%percmap ABC_note percussion [note_head]
// The percussion may be a number (MIDI percussion number range 35..81),
// a ABC note or a possibly abbreviated percussion name.
// See https://wim.vree.org/js2/tabDrumDoc.html for more information.

abc2svg.perc = {

    // parse %%percmap
    do_perc: function(parm) {
    var	pits = new Int8Array([0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6]),
	accs = new Int8Array([0, 1, 0, -1, 0, 0, 1, 0, -1, 0, -1, 0])

// GM drum
// 35 B,,,	Acoustic Bass Drum	a-b-d
// 36 C,,	Bass Drum 1		b-d-1
// 37 ^C,,	Side Stick		s-s
// 38 D,,	Acoustic Snare		a-s
// 39 ^D,,	Hand Clap		h-c
// 40 E,,	Electric Snare		e-s
// 41 F,,	Low Floor Tom		l-f-t
// 42 ^F,,	Closed Hi Hat		c-h-h
// 43 G,,	High Floor Tom		h-f-t
// 44 ^G,,	Pedal Hi-Hat		p-h-h
// 45 A,,	Low Tom			l-to
// 46 ^A,,	Open Hi-Hat		o-h-h
// 47 B,,	Low-Mid Tom		l-m-t
// 48 C,	Hi Mid Tom		h-m-t
// 49 ^C,	Crash Cymbal 1		c-c-1
// 50 D,	High Tom		h-to
// 51 ^D,	Ride Cymbal 1		r-c-1
// 52 E,	Chinese Cymbal		c-c
// 53 F,	Ride Bell		r-b
// 54 ^F,	Tambourine		t
// 55 G,	Splash Cymbal		s-c
// 56 ^G,	Cowbell			co
// 57 A,	Crash Cymbal 2		c-c-2
// 58 ^A,	Vibraslap		v
// 59 B,	Ride Cymbal 2		r-c-2
// 60 C		Hi Bongo		h-b
// 61 ^C	Low Bongo		l-b
// 62 D		Mute Hi Conga		m-h-c
// 63 ^D	Open Hi Conga		o-h-c
// 64 E		Low Conga		l-c
// 65 F		High Timbale		h-ti
// 66 ^F	Low Timbale		l-ti
// 67 G		High Agogo		h-a
// 68 ^G	Low Agogo		l-a
// 69 A		Cabasa			ca
// 70 ^A	Maracas			m
// 71 B		Short Whistle		s-w
// 72 c		Long Whistle		l-w
// 73 ^c	Short Guiro		s-g
// 74 d		Long Guiro		l-g
// 75 ^d	Claves			cl
// 76 e		Hi Wood Block		h-w-b
// 77 f		Low Wood Block		l-w-b
// 78 ^f	Mute Cuica		m-c
// 79 g		Open Cuica		o-c
// 80 ^g	Mute Triangle		m-t
// 81 a		Open Triangle		o-t

// percussion reduced names (alphabetic order)
var prn = {
	"a-b-d": 35,
	"a-s":   38,
	"b-d-1": 36,
	"ca":    69,
	"cl":    75,
	"co":    56,
	"c-c":   52,
	"c-c-1": 49,
	"c-c-2": 57,
	"c-h-h": 42,
	"e-s":   40,
	"h-a":   67,
	"h-b":   60,
	"h-c":   39,
	"h-f-t": 43,
	"h-m-t": 48,
	"h-ti":  65,
	"h-to":  50,
	"h-w-b": 76,
	"l-a":   68,
	"l-b":   61,
	"l-c":   64,
	"l-f-t": 41,
	"l-g":   74,
	"l-m-t": 47,
	"l-ti":  66,
	"l-to":  45,
	"l-w":   72,
	"l-w-b": 77,
	"m":     70,
	"m-c":   78,
	"m-h-c": 62,
	"m-t":   80,
	"o-c":   79,
	"o-h-c": 63,
	"o-h-h": 46,
	"o-t":   81,
	"p-h-h": 44,
	"r-b":   53,
	"r-c-1": 51,
	"r-c-2": 59,
	"s-c":   55,
	"s-g":   73,
	"s-s":   37,
	"s-w":   71,
	"t":     54,
	"v":     58
}

    // convert a drum instrument to a note
    function tonote(p) {
    var	i, j, s,
	pit = Number(p)

	if (isNaN(pit)) {
		s = p.match(/^([_^]*)([A-Ga-g])([,']*)$/)	// '
		if (s) {				// note name
			i = "CDEFGABcdefgab".indexOf(s[2]) + 16
			switch(s[3]) {
			case "'":
				i += 7 * s[3].length
				break
			case ',':
				i -= 7 * s[3].length
				break
			}
			note = {
				pit: i,
				apit: i
			}
			switch (s[1]) {
			case '^': note.acc = 1; break
			case '_': note.acc = -1; break
			}
			return note
		}

		// drum instrument name
		p = p.toLowerCase(p);
		s = p[0];		// get the 1st letters after '-'
		i = 0
		while (1) {
			j = p.indexOf('-', i)
			if (j < 0)
				break
			i = j + 1;
			s += '-' + p[i]
		}
		pit = prn[s]

		// solve some specific cases
		if (!pit) {
			switch (p[0]) {
			case 'c':
				switch (p[1]) {
				case 'a': pit = prn.ca; break
				case 'l': pit = prn.cl; break
				case 'o': pit = prn.co; break
				}
				break
			case 'h':
			case 'l':
				i = p.indexOf('-')
				if (p[i + 1] != 't')
					break
				switch (p[1]) {
				case 'i':
				case 'o':
					pit = prn[s + p[1]]
					break
				}
				break
			}
		}
	}
	if (!pit)
		return

	p = ((pit / 12) | 0) * 7 - 19;	// octave
	pit = pit % 12;			// in octave
	p += pits[pit];
	note = {
		pit: p,
		apit: p
	}
	if (accs[pit])
		note.acc = accs[pit]
	return note
    } // tonote()

    // normalize a note for mapping
    function norm(p) {
    var	a = p.match(/^([_^]*)([A-Ga-g])([,']*)$/)	// '
	if (!a)
		return
	if (p.match(/[A-Z]/)) {
		p = p.toLowerCase();
		if (p.indexOf("'") > 0)
			p = p.replace("'", '')
		else
			p += ','
	}
	return p
    } // norm()

    var	n, v,
	maps = this.get_maps(),
	a = parm.split(/\s+/);

	n = norm(a[1])
	if (!n) {
		this.syntax(1, abc.errs.bad_val, "%%percmap")
		return
	}
	if (this.cfmt().sound != "play") {		// !play
		if (!a[3])
			return
		if (!maps.MIDIdrum)
			maps.MIDIdrum = {}
		v = tonote(n)
		if (!v) {
			this.syntax(1, abc.errs.bad_val, "%%percmap")
			return
		}
		delete v.acc
		maps.MIDIdrum[n] = [[a[3]], v]
	} else {					// play
		v = tonote(a[2])
		if (!v) {
			this.syntax(1, abc.errs.bad_val, "%%percmap")
			return
		}
		if (!maps.MIDIdrum)
			maps.MIDIdrum = {}
		maps.MIDIdrum[n] = [null, v]
	}
	this.set_v_param("perc", "MIDIdrum")
    }, // do_perc()

    // set the MIDI parameters in the current voice
    set_perc: function(a) {
    var	i, item,
	curvoice = this.get_curvoice()

	for (i = 0; i < a.length; i++) {
		switch (a[i]) {
		case "perc=":				// %%percmap
			if (!curvoice.map)
				curvoice.map = {}
			curvoice.map = a[i + 1];
			if (!curvoice.midictl)
				curvoice.midictl = {}
			curvoice.midictl[0] = 1		// bank 128
			break
		}
	}
    }, // set_perc()

    do_pscom: function(of, text) {
	if (text.slice(0, 8) == "percmap ")
		abc2svg.perc.do_perc.call(this, text)
	else
		of(text)
    },

    set_vp: function(of, a) {
	abc2svg.perc.set_perc.call(this, a);
	of(a)
    }
} // perc

abc2svg.modules.hooks.push(
// export
	"errs",
	"syntax",
// hooks
	[ "do_pscom", "abc2svg.perc.do_pscom" ],
	[ "set_vp", "abc2svg.perc.set_vp" ]
);

// the module is loaded
abc2svg.modules.percmap.loaded = true
