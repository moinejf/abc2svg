//JS abc2svg - french translation of the error codes
//	traduction des codes d'erreur en français
//	par Jean-François Moine
// Appelez ce fichier dans la ligne de commande pour avoir
// les messages d'erreur en français

user.textrans = {
	"+: lyric without music": "+: paroles sans musique",
	"+: symbol line without music":
			"+: plus de musique pour s:",
	"+: without previous info field": "Pas de ligne info avant +:",
	"'{' in grace note": "'{' dans notes d'agrément",
	"'}', ')' or ']' missing in %%staves":
				"Il manque '}', ')' ou ']' dans %%staves",
	"',' lacking in annotation '@x,y'":
				"Il manque une ',' dans l'annotation '@x,y'",
	"'$1' is not a note": "'$1' n'est pas une note",
	"'$1:' line ignored": "'$1:' ligne ignorée",
	"$1: inside tune - ignored": "$1: en milieu de morceau - ignoré",
	"!$1! must be on a note": "!$1! doit être sur une note",
	"!$1! must be on a note or a rest":
				"!$1! doit être sur une note ou un silence",
	"!$1! must be on the last of a couple of notes":
				"!$1! doit être sur la 2ème note d'un couple",
	"!beamon! must be on a bar": "!beamon! doit être sur une barre",
	"!xstem! must be on a note": "!xstem! doit être sur une note",
	"%%deco: abnormal h/wl/wr value '$1'":
				"%%deco: valeur '$1' anormale pour h/wl/wr",
	"%%deco: bad C function index '$1'":
				"%%deco: mauvais index de fonction '$1'",
	"%%deco: bad C function value '$1'":
				"%%deco: mauvaise valeur de fonction '$1'",
	"%%deco: cannot have a negative value '$1'":
				"%%deco: '$1' ne peut pas avoir de valeur négative",
	"%%multicol end without start": "%%multicol end sans start",
	"%%multicol new without start": "%%multicol new sans start",
	"%%repeat cannot start a tune": "%%repeat ne peut pas être en début de morceau",
	"%%select ignored": "%%select ignoré",
	"%%staffwidth too big": "%%staffwidth trop grand",
	"%%staffwidth too small": "%%staffwidth trop petit",
	"%%tune not treated yet": "%%tune n'est pas encore traité",
	"%%voice ignored": "%%voice ignoré",
	"%%vskip cannot be negative": "%%vskip ne peut pas être négatif",
	"Bad !xstem!": "!xstem! erroné",
	"Bad %%setbarnb value": "Valeur incorrecte dans %%setbarnb",
	"Bad %%staff number $1 (cur $2, max $3)":
				"Numéro $1 %%staff incorrect (cur $2, max $3)",
	"Bad %%staff value '$1'": "Valeur incorrecte '$1' dans %%staff",
	"Bad %%stafflines value": "Valeur incorrecte dans %%stafflines",
	"Bad %%staffscale value": "Valeur incorrecte dans %%staffscale",
	"Bad char '$1' in M:": "Mauvais caractère '$1' dans M:",
	"Bad character '$1'": "Mauvais caractère '$1'",
	"Bad controller number in %%MIDI": "Mauvais numéro de controleur dans %%MIDI",
	"Bad controller value in %%MIDI": "Mauvaise valeur de controle dans %%MIDI",
	"Bad duration '$1' in M:": "Durée '$1' incorrecte dans M:",
	"Bad integer value": "Mauvaise valeur entière",
	"Bad instr= value": "Mauvaise valeur de instr=",
	"Bad L: value": "Mauvaise valeur pour L:",
	"Bad note in %%map": "Note incorrecte dans %%map",
	"Bad page width": "Mauvaise largeur de page",
	"Bad program in %%MIDI": "Mauvais 'program' dans %%MIDI",
	"Bad scale value in %%font": "Mauvaise échelle dans %%font",
	"Bad tie": "Mauvaise liaison de prolongation",
	"Bad transpose value": "Mauvaise valeur de transposition",
	"Bad user character '$1'": "Caractère illégal '$1' dans U:/%%user",
	"Bad value '$1' in %%linebreak - ignored":
				"Valeur incorrecte '$1' dans %%linebreak - ignorée",
	"Bad value in $1": "Mauvaise valeur dans $1",
	"Bad voice ID in %%staves": "Mauvaise identité de voix dans %%staves",
	"Bar in repeat sequence": "Barre dans la séquence à répéter",
	"Cannot have !$1! on a head": "!$1! ne peut pas être sur une tête de note",
	"Cannot have %%fullsvg inside a tune":
				"'%%fullsvg' ne peut pas être dans un morceau",
	"Cannot have a bar in grace notes":
			"Il ne peut pas y avoir de barre dans les notes d'agrément",
	"Cannot have a broken rhythm in grace notes":
			"Il ne peut pas y avoir '<' ou '>' dans les notes d'agrément",
	"Cannot have V:* in tune body":
			"Il ne peut pas y avoir V:* dans le corps du morceau",
	"Cannot read file '$1'": "Fichier '$1' inexistant",
	"Decoration ignored": "Décoration ignorée",
	"Empty line in tune header - ignored":
				"Ligne vide dans en-tête de morceau - ignorée",
	"Erroneous end of voice overlay": "Fin de superposition de voix erronée",
	"Incorrect 1st value in %%repeat": "Première valeur incorrecte dans %%repeat",
	"Incorrect 2nd value in %%repeat": "Deuxième valeur incorrecte dans %%repeat",
	"Invalid 'r' in tuplet": "'r' invalide dans le tuplet",
	"Invalid decoration '$1'": "Décoration '$1' invalide",
	"Invalid note duration $1": "Durée de note $1 invalide",
	"Lack of ']'": "']' manquant",
	"Lack of ending $1 in U:/%%user": "Pas de $1 terminant U:/%%user",
	'Lack of starting ! or " in U: / %%user':
				'U: / %%user ne commence pas par ! ou "',
	"Line split problem - adjust maxshrink and/or breaklimit":
		"Problème de découpe en lignes - ajuster maxshrink et/ou breaklimit",
	"Line too much shrunk $1 $2 $3": "Ligne trop compressée $1 $2 $3",
	"Line underfull ($1pt of $2pt)": "Trop d'espacement ($1pt of $2pt)",
	"Misplaced '$1' in %%staves": "'$1' mal placé dans %%staves",
	"Misplaced dot": "Point mal placé",
	"Mix of old and new transposition syntaxes":
			"Mélange des syntaxes de transposition ancienne et nouvelle",
	"No $1 after %%$2": "Pas de $1 après %%$2",
	"No </defs> in %%beginsvg sequence":
				"Pas de </defs> dans séquence %%beginsvg",
	"No </style> in %%beginsvg sequence":
				"Pas de </style> dans séquence %%beginsvg",
	"No accidental after 'exp'": "Pas d'altération après 'exp'",
	"No end of decoration": "Pas de fin de décoration",
	"No end of grace note sequence": "Pas de fin de notes d'agrément",
	"No end of guitar chord": "Pas de fin d'indication d'accord",
	"No end of repeat string": "Chaine de répétition non terminée",
	"No end of tuplet": "Pas de fin de tuplet",
	"No end of tuplet in this music line":
				"Pas de fin de tuplet dans cette ligne de musique",
	"No end of voice overlay": "Pas de fin de superposition de voix",
	"No function for decoration '$1'": "Pas de fonction pour décoration '$1'",
	"No note before '-'": "Pas de note devant '-'",
	"No note before '<'": "Pas de note devant '<'",
	"No note in voice overlay": "Pas de note dans voix superposée",
	"No read_file support": "La fonction read_file n'existe pas",
	"No start of !$1!": "Pas de début pour !$1!",
	"Not a note in grace note sequence":
				"Caractère incorrect dans notes d'agrément",
	"Not an ASCII character": "Ce n'est pas un caractère ASCII",
	"Not enough measure bars for lyric line":
				"Pas assez de barres pour la ligne de paroles",
	"Not enough measure bars for symbol line":
				"Pas assez de barres pour ligne s:",
	"Not enough measures for %%repeat":
				"Pas assez de mesures pour %%repeat",
	"Not enough parameters in %%map":
				"Pas assez de paramètres dans %%map",
	"Not enough notes/rests for %%repeat":
				 "Pas assez de notes/silences pour %%repeat",
	"Note too long": "Durée de note trop longue",
	"Note too short": "Durée de note trop courte",
	"s: without music": "s: sans musique",
	"Too many elements in symbol line": "Trop d'éléments dans ligne s:",
	"Too many include levels": "Trop de niveaux d'inclusion de fichier",
	"Too many ties": "Trop de liaisons de prolongation",
	"Too many words in lyric line": "Trop de mots dans la ligne de paroles",
	"Unknown bagpipe-like key": "Armature de cornemuse inconnue",
	"Unknown clef '$1'": "Clé '$1' inconnue",
	"Unknown decoration '$1'": "Décoration '$1' inconnue",
	"Unknown font $1": "Police $1 inconnue",
	"Unknown glyph: '$1'": "Glyph '$1' inconnu",
	"Unknown keyword '$1' in %%multicol": "Mot clé '$1' inconnu dans %%multicol",
	"Unsecure code": "Code dangereux",
	"Unterminated string": "Chaine de caractères non terminée",
	"Unterminated string in Q:": "Chaine de caractères non terminée dans Q:",
	"Voice overlay already started": "Superposition de voix déjà démarrée",
	"w: without music": "w: sans musique",
	"Wrong duration in voice overlay":
				"Mauvaise durée de la voix superposée"
}
