//JS - abc2svg edit - textes en français
function loadtxt() {
	var e;
	texts = {
		bad_nb: 'Mauvais numéro de ligne',
		fn: 'Nom de fichier: ',
		load: 'SVP, ouvrez le fichier à inclure ',
		play: 'Jouer',
		stop: 'Arrêter',
	}
	document.getElementById("a").innerHTML = 'A propos';
	document.getElementById("b").innerHTML = 'Fichiers ABC:';
//	document.getElementById("df").innerHTML = 'abc2svg features';
//	document.getElementById("dp").innerHTML = 'abc2svg parameters';
	document.getElementById("er").innerHTML = 'Erreurs';
	document.getElementById("f").innerHTML = 'Fichier';
	document.getElementById("fl").innerHTML = 'Ouvrir un fichier';
	document.getElementById("fo").innerHTML = 'Suivre la musique';
	document.getElementById("fs").innerHTML = 'Taille police';
	document.getElementById("gv").innerHTML = 'Volume son';
	document.getElementById("h").innerHTML = 'Aide';
	document.getElementById("ha").innerHTML = 'Aide';
	document.getElementById("lg").innerHTML = 'Langue';
	document.getElementById("playbutton").innerHTML = 'Jouer';
	document.getElementById("pr").innerHTML = 'Préférences';
	document.getElementById("saveas").innerHTML = 'Sauver le fichier';
	document.getElementById("sftl").innerHTML = 'type';
	document.getElementById("sful").innerHTML = 'Police de sons URL';

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
