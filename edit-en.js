//JS - abc2svg edit - text in English
function loadtxt() {
	texts = {
		bad_nb: 'Bad line number',
		fn: 'File name: ',
		load: 'Please, load the included file ',
		play: 'Play',
		stop: 'Stop',
	}
	var text_kv = {
		a: 'About',
		b: 'ABC files:',
//		df: 'abc2svg features',
//		dp: 'abc2svg parameters',
		er: 'Errors',
		f: 'File',
		fl: 'Load file',
		fs: 'Font size',
		gv: 'Volume',
		h: 'Help',
		ha: 'Help',
		lg: 'Language',
		playbutton: 'Play',
		pr: 'Preferences',
		saveas: 'Save file',
		sful: 'Soundfont URL',
		sp: 'Speed'
	}

	for (var k in text_kv)
		document.getElementById(k).innerHTML = text_kv[k];

	document.getElementById("hlp").outerHTML = '<ul id="hlp">\n\
<li>You may either:\n\
    <ul>\n\
	<li>directly write ABC code in the text area, or</li>\n\
	<li>paste ABC code in the text area, or</li>\n\
	<li>load a local ABC file (\'ABC | Load file\' button), or</li>\n\
	<li>drag &amp; drop a local file from your file manager\n\
		or a selected text to the text area.</li>\n\
    </ul></li>\n\
	<li>You may change at will the ABC code in the text area.<br/>\n\
	Rendering is done 2 seconds later.</li>\n\
	<li>The \'Print\' button of the browser outputs the rendering area.</li>\n\
</ul>'
}
