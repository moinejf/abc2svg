//JS - abc2svg edit - texto em português do Brasil
function loadtxt() {
	texts = {
		bad_nb: 'Número de linha incorreto',
		fn: 'Nome do arquivo: ',
		load: 'Por favor, inclua o arquivo ',
		play: 'Tocar',
		stop: 'Parar',
	}
	var text_kv = {
		a: 'Sobre',
		b: 'Arquivos ABC:',
//		df: 'abc2svg features',
//		dp: 'abc2svg parameters',
		er: 'Erros',
		f: 'Arquivo',
		fl: 'Abrir arquivo ABC',
		fs: 'Tamanho da fonte',
		gv: 'Volume',
		h: 'Ajuda',
		ha: 'Ajuda',
		lg: 'Língua',
    		playbutton: 'Tocar',
		pr: 'Opções',
		saveas: 'Salvar arquivo',
		sful: 'Sound font URL',
		sp: 'Speed'
	}

	for (var k in text_kv)
		document.getElementById(k).innerHTML = text_kv[k];

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
