//JS - abc2svg edit - Text in Deutsch
function loadtxt() {
	texts = {
		bad_nb: 'fehlerhafte Zeilennummer',
		fn: 'Filename: ',
		load: 'Bitte öffne die eingebundene Datei ',
		play: 'Wiedergabe',
		stop: 'Stop',
	}
	var text_kv = {
		a: 'Über ...',
		b: 'ABC-Files:',
//		df: 'abc2svg features',
//		dp: 'abc2svg parameters',
		er: 'Fehler',
		f: 'File',
		fl: 'Lade File',
		fo: 'Follow music',
		fs: 'Schriftgröße',
		gv: 'Lautstärke',
		h: 'Hilfe',
		ha: 'Hilfe',
		lg: 'Sprache',
    		playbutton: 'Wiedergabe',
		pr: 'Einstellungen',
		saveas: 'Speichere File',
		sful: 'Sound font URL',
		sp: 'Speed'
	}

	for (var k in text_kv)
		document.getElementById(k).innerHTML = text_kv[k];

	document.getElementById("hlp").outerHTML = '<ul id="hlp">\n\
<li>Du kannst entweder:\n\
    <ul>\n\
	<li>im Textfeld direkt ABC-Code direkt eintragen, oder</li>\n\
	<li>ABC-Code im Textfeld aus der Zwischenablage einfügen, oder</li>\n\
	<li>ein lokales ABC-File laden (\'ABC | Lade File\' Taste), oder</li>\n\
	<li>ein lokales File von deinem Filemanager per Drag/Drop einfügen\n\
		oder einen ausgewählten Text in das Textfeld ziehen.</li>\n\
    </ul></li>\n\
	<li>Du kannst den ABC-Code im Textfeld beliebig bearbeiten<br/>\n\
	Nach zwei Sekunden wird die Notengrafik aktualisiert.</li>\n\
	<li>Die Funktion  \'Drucken\' im Browser gibt nur die Notengrafik aus.</li>\n\
</ul>';
}
