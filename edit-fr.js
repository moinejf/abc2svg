//JS - abc2svg edit - textes en français
function loadtxt() {
	texts = {
		bad_nb: 'Mauvais numéro de ligne',
		fn: 'Nom de fichier: ',
		load: 'SVP, ouvrez le fichier à inclure ',
		play: 'Jouer',
		stop: 'Arrêter',
	}
	var text_kv = {
		a: 'A propos',
		b: 'Fichiers ABC:',
//		df: 'abc2svg features',
//		dp: 'abc2svg parameters',
		er: 'Erreurs',
		f: 'Fichier',
		fl: 'Ouvrir un fichier',
		fs: 'Taille police',
		gv: 'Volume son',
		h: 'Aide',
		ha: 'Aide',
		lg: 'Langue',
		playbutton: 'Jouer',
		pr: 'Préférences',
		saveas: 'Sauver le fichier',
		sful: 'URL police de sons',
		sp: 'Vitesse'
	}

	for (var k in text_kv)
		document.getElementById(k).innerHTML = text_kv[k];

	document.getElementById("hlp").outerHTML = '<ul  id="hlp">\n\
<li>Vous pouvez, soit:\n\
    <ul>\n\
	<li>écrire directement du code ABC dans la zone d\'édition, ou</li>\n\
	<li>coller du code ABC dans la zone d\'édition, ou</li>\n\
	<li>charger un fichier ABC local (bouton \'Ouvrir un fichier\'), ou</li>\n\
	<li>glisser-déposer un fichier ABC local\n\
		ou une sélection de texte dans la zone d\'édition.</li>\n\
    </ul></li>\n\
<li>Vous pouvez modifier le code ABC comme vous voulez.<br/>\n\
	Le rendu se fait 2 secondes après.</li>\n\
<li>Le bouton \'Imprimer\' de votre browser n\'imprime que la zone de rendu.</li>\n\
</ul>';
}
