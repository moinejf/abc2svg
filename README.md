## abc2svg

**abc2svg** is a rewrite of [abcm2ps](http://moinejf.free.fr/) into Javascript.

It permits to edit, display, print and play music from files written in
[ABC](http://abcnotation.com/).

### Web usage

**abc2svg** may be used in any web browser.
The needed files are available in my site
[http://moinejf.free.fr/js/](http://moinejf.free.fr/js).  
They are updated on release change.

These files are:

- `abc2svg-1.js`
This script is the **abc2svg** core.  
It contains the ABC parser and the SVG generation engine.  
It must be included in the pages where ABC rendering is needed
(in `&ltscript src=` tags).

- `abcps2svg-1.js`
This script contains the core and a small PostScript interpreter.  
It may be used in place of `abc2svg-1.js` to render some customized
decorations defined for `abcm2ps`.

- `abcemb-1.js`
This script is to be used in (X)HTML pages with the core.  
It replaces the ABC sequences by music SVG images
(the ABC sequences start on `X:` or `%abc` at start of line,
and stop on any ML tag).  
See the
[%%beginml documentation](http://moinejf.free.fr/abcm2ps-doc/beginml.xhtml)
for an example.

- `abcdoc-1.js`
This script is also to be used in (X)HTML pages with the core.  
Mainly used for ABC documentation, it lets the ABC source sequences
in the page before the SVG images.  
See the 
[abcm2ps/abc2svg features](http://moinejf.free.fr/abcm2ps-doc/features.xhtml)
for an example.

- `play-1.js`
This script may be used with `abcemb-1.js` for playing the
rendered ABC music.  
See [this page](http://moinejf.free.fr/abcm2ps-doc/au_clair.xhtml)
for an example.

- `edit-1.xhtml` and `psedit-1.xhtml`
These are web ABC editors/players (resp. without and with PS support).

When looking at a ABC file in a web browser, you may also use this bookmarklet,
<a href="javascript:(function(){return'<?xml version=&quot;1.0&quot;encoding=&quot;UTF-8&quot;?>\n<!DOCTYPE html PUBLIC &quot;-//W3C//DTD XHTML 1.1//EN&quot;\n&quot;http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd&quot;>\n<html xmlns=&quot;http://www.w3.org/1999/xhtml&quot;>\n<head>\n<meta http-equiv=&quot;Content-Type&quot;content=&quot;text/html;charset=UTF-8&quot;/>\n<link href=&quot;http://moinejf.free.fr/js/edit-1.css&quot; rel=&quot;stylesheet&quot; type=&quot;text/css&quot;/>\n<title>ABC</title>\n<script src=&quot;http://moinejf.free.fr/js/abc2svg-1.js&quot;type=&quot;text/javascript&quot;></script>\n<script src=&quot;http://moinejf.free.fr/js/abcemb-1.js&quot;type=&quot;text/javascript&quot;></script>\n</head>\n<body>\n%25abc2.2\n'+document.body.textContent+'</body>\n</html>'})();">ABC render</a>,
and render the music.

#####Notes:
- The music is rendered as SVG images. There is one image per
music line / text block.  
If you want to move these images to some other files,
each one must contain the full CSS and defs. For that, insert
```
%%fullsvg true
```
in the ABC file before rendering.

- Playing uses HTML5 audio.

- With the editor, if you want to render ABC files
which contain `%%abc-include`, you must:
  - load the ABC file from the browse button
  - click in the include file name
  - load the include file by the same browse button  
Then, you may edit and save both files.  
Rendering/playing is always done from the first ABC file.  
There may be only one included file.

- The .js and .xhtml file names have a suffix which is the version of
the core interface (actually `-1`).

### Build

To build the **abc2svg** scripts in your machine, you must first get the files
from [github](https://github.com/moinejf/abc2svg), either as a `.zip` file,
or by cloning the repository:

    git clone http://github.com/moinejf/abc2svg

(you may use `--depth=1` if you don't want the `git` history)

You need the tools `ninja`, `uglify` (nodejs), `base64` and
`fontforge`. Then, building is simply done by

    ninja -v

### Batch

After building the **abc2svg** scripts, you will be able to generate music
sheets from the command line as you did with `abcm2ps`, thanks to the
following shell scripts:  
`abcjs24` js24 (Mozilla JavaScript shell - Spidermonkey  
`abcjsc` jsc-1 (webkitgtk2)  
`abcnode` nodejs  
`abcps` js24 + PS support  
`abcv8` d8 (libv8 Google)  
