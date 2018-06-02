//JS - abc2svg edit - text in Italian
function loadtxt() {
	texts = {
		bad_nb: 'Numero di linea errato',
		fn: 'Nome file: ',
		load: 'Carica il file da includere ',
		play: 'Suona',
		stop: 'Ferma',
	}
	var text_kv = {
		a: 'A proposito',
		b: 'File ABC:',
//		df: 'Caratteristiche di abc2svg',
//		dp: 'Parametri di abc2svg',
		er: 'Errori',
		f: 'File',
		fl: 'Carica file',
		fs: 'Dimensione del font',
		gv: 'Volume',
		h: 'Aiuto',
		ha: 'Aiuto',
		lg: 'Lingua',
		playbutton: 'Suona',
		pr: 'Preferenze',
		saveas: 'Salva il file',
		sful: 'URL del Soundfont',
		sp: 'Velocità'
	}

	for (var k in text_kv)
		document.getElementById(k).innerHTML = text_kv[k];

	document.getElementById("hlp").outerHTML = '<ul id="hlp">\n\
<li>Opzioni:\n\
    <ul>\n\
	<li>scrivere direttamente codice ABC nell\'area di testo, oppure</li>\n\
	<li>incollare codice ABC nell\'area di testo, oppure</li>\n\
	<li>caricare un file ABC locale (menu \'ABC | Carica file\'), oppure</li>\n\
	<li>trascinare un file locale da file manager\n\
		o del testo selezionato nell\'area di testo.</li>\n\
    </ul></li>\n\
	<li>Puoi modificare il codice ABC nell\'area di testo;<br/>\n\
	dopo 2 secondi la musica viene visualizzata o aggiornata.</li>\n\
	<li>L\'opzione \'Stampa\' del browser stampa la musica.</li>\n\
</ul>'
}
