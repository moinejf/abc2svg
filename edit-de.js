//JS - abc2svg edit - Text in Deutsch
function loadtxt() {
	var e;
	texts = {
		bad_nb: 'fehlerhafte Zeilennummer',
		fn: 'Filename: ',
		load: 'Bitte öffne die eingebundene Datei ',
		play: 'Wiedergabe',
		stop: 'Stop',
	}
	document.getElementById("a").innerHTML = 'Über ...';
	document.getElementById("b").innerHTML = 'ABC-Files:';
//	document.getElementById("df").innerHTML = 'abc2svg features';
//	document.getElementById("dp").innerHTML = 'abc2svg parameters';
	document.getElementById("er").innerHTML = 'Fehler';
	document.getElementById("f").innerHTML = 'File';
	document.getElementById("fl").innerHTML = 'Lade File';
	document.getElementById("fo").innerHTML = 'Follow music';
	document.getElementById("fs").innerHTML = 'Schriftgröße';
	document.getElementById("gv").innerHTML = 'Lautstärke';
	document.getElementById("h").innerHTML = 'Hilfe';
	document.getElementById("ha").innerHTML = 'Hilfe';
	document.getElementById("lg").innerHTML = 'Sprache';
    	document.getElementById("playbutton").innerHTML = 'Wiedergabe';
	document.getElementById("pr").innerHTML = 'Einstellungen';
	document.getElementById("saveas").innerHTML = 'Speichere File';
	document.getElementById("sftl").innerHTML = 'type';
	document.getElementById("sful").innerHTML = 'Sound font URL';

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
