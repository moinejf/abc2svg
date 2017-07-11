//JS - abc2svg edit - texto em português do Brasil
function loadtxt() {
	var e;
	texts = {
		bad_nb: 'Número de linha incorreto',
		fn: 'Nome do arquivo: ',
		load: 'Por favor, inclua o arquivo ',
		play: 'Tocar',
		stop: 'Parar',
	}
	document.getElementById("a").innerHTML = 'Sobre';
	document.getElementById("b").innerHTML = 'Arquivos ABC:';
//	document.getElementById("df").innerHTML = 'abc2svg features';
//	document.getElementById("dp").innerHTML = 'abc2svg parameters';
	document.getElementById("er").innerHTML = 'Erros';
	document.getElementById("f").innerHTML = 'Arquivo';
	document.getElementById("fl").innerHTML = 'Abrir arquivo ABC';
	document.getElementById("fo").innerHTML = 'Follow music';
	document.getElementById("fs").innerHTML = 'Tamanho da fonte';
	document.getElementById("gv").innerHTML = 'Volume';
	document.getElementById("h").innerHTML = 'Ajuda';
	document.getElementById("ha").innerHTML = 'Ajuda';
	document.getElementById("lg").innerHTML = 'Língua';
    	document.getElementById("playbutton").innerHTML = 'Tocar';
	document.getElementById("pr").innerHTML = 'Opções';
	document.getElementById("saveas").innerHTML = 'Salvar arquivo';
	document.getElementById("sftl").innerHTML = 'type';
	document.getElementById("sful").innerHTML = 'Sound font URL';

	document.getElementById("hlp").outerHTML = '<ul  id="hlp">\n\
<li>Você pode:\n\
    <ul>\n\
	<li>escrever música em notação ABC diretamente na área de edição, ou</li>\n\
	<li>colar notação ABC na área de edição, ou</li>\n\
	<li>abrir um arquivo ABC local\n\
		(usando o botão \'Arquivo | Abrir arquivo\'), ou</li>\n\
	<li>arrastar e soltar na área de edição um arquivo ABC do seu gerenciador de arquivos\n\
		ou algum texto selecionado.</li>\n\
    </ul></li>\n\
<li>Você pode modificar o código ABC à vontade na área de edição.\n\
	Após 2 segundos, a partitura será gerada.</li>\n\
<li>A função \'Imprimir\' do seu navegador imprimirá apenas a partitura.</li>\n\
</ul>';
}
