//JS - abc2svg edit - text in English
function loadtxt() {
	var e;
	texts = {
		bad_nb: 'Bad line number',
		fn: 'File name: ',
		load: 'Please, load the included file ',
		play: 'Play',
		stop: 'Stop',
	}
	document.getElementById("a").innerHTML = 'About';
	document.getElementById("b").innerHTML = 'ABC files:';
//	document.getElementById("df").innerHTML = 'abc2svg features';
//	document.getElementById("dp").innerHTML = 'abc2svg parameters';
	document.getElementById("er").innerHTML = 'Errors';
	document.getElementById("f").innerHTML = 'File';
	document.getElementById("fl").innerHTML = 'Load file';
	document.getElementById("fo").innerHTML = 'Follow music';
	document.getElementById("fs").innerHTML = 'Font size';
	document.getElementById("gv").innerHTML = 'Volume';
	document.getElementById("h").innerHTML = 'Help';
	document.getElementById("ha").innerHTML = 'Help';
	document.getElementById("lg").innerHTML = 'Language';
    	document.getElementById("playbutton").innerHTML = 'Play';
	document.getElementById("pr").innerHTML = 'Preferences';
	document.getElementById("saveas").innerHTML = 'Save file';
	document.getElementById("sftl").innerHTML = 'type';
	document.getElementById("sful").innerHTML = 'Soundfont URL';

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
</ul>';
}
