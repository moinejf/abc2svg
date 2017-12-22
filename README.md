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
  It must be included in the (X)HTML header of the pages
  where ABC rendering is needed (in `<script src=` tags).

- `abcemb-1.js`
  This script is to be used in (X)HTML pages with the core.  
  It replaces the ABC sequences by SVG images of the music
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

- `follow-1.js`
  This script may be used after `play-1.js` for highlighting the notes
  while playing.
  See [this page](http://moinejf.free.fr/abcm2ps-doc/tabac.xhtml)
  for an example.

- `edit-1.xhtml`
  This is a simple web ABC editor/player.

When looking at a ABC file in a web browser, you may also use
the following bookmarklet and render the music
(create a bookmark and paste the following javascript code
into the address/location box).

```
javascript:(function(){d=document;b=d.body;b.innerHTML="\n%25abc2.2\n%25<!--[CDATA[\n"+b.textContent+"%25]]-->\n";function%20f(u){s=d.createElement('script');s.setAttribute('src',u);b.appendChild(s);};f('http://moinejf.free.fr/js/abc2svg-1.js');f('http://moinejf.free.fr/js/abcemb-1.js');f('http://moinejf.free.fr/js/play-1.js');function%20t(){if(typeof%20dom_loaded=="function"){dom_loaded()}else{setTimeout(t,200)}};setTimeout(t,200)})();void(0)
```

##### Notes:
- The music is rendered as SVG images. There is one image per
  music line / text block.  
  If you want to move these images to some other files,
  each one must contain the full CSS and defs. For that, insert
```
%%fullsvg x
```
  in the ABC file before rendering (see
  http://moinejf.free.fr/abcm2ps-doc/fullsvg.xhtml for more information).

- Playing uses HTML5 audio.

- With the editor, if you want to render ABC files
  which contain `%%abc-include`, you must:
  - load the ABC file from the browse button
  - click in the include file name
  - load the include file by the same browse button  

  Then, you may edit and save both files.  
  Rendering/playing is always done from the first ABC file.  
  There may be only one included file.

- The editor comes with different ways to enter the music from the keyboard.  
  If you have a US keyboard, you may try these bookmarklets:

```
javascript:(function(){if(typeof%20loadjs=='function'){loadjs('abckbd-1.js')}else{alert('use%20with%20abc2svg%20editor')}})();void(0)
```

```
javascript:(function(){if(typeof%20loadjs=='function'){loadjs('abckbd2-1.js')}else{alert('use%20with%20abc2svg%20editor')}})();void(0)
```

- The .js and .xhtml file names have a suffix which is the version of
  the core interface (actually `-1`).

### nodeJS usage

Installed via **npm**, the **abc2svg** package comes with the
command line (batch) program `abc2svg`.

This one may be used as **abcm2ps** to generate XHTML files,
but it writes to standard output:

    abc2svg mytunes.abc > Out.xhtml

### Build

If you want to build the **abc2svg** scripts in your machine,
you must first get the files
from [github](https://github.com/moinejf/abc2svg),
either as a `tar.gz` or `.zip` file, or by cloning the repository:

    git clone http://github.com/moinejf/abc2svg

(you may use `--depth=1` if you don't want the full `git` history)

Then, building is done using the tool [ninja](https://ninja-build.org/)
or [samurai](https://github.com/michaelforney/samurai).  
You may do it:

- without minification  
  This is interesting for debug purpose, the scripts being more human friendly.

```
    NOMIN=1 samu -v
```

- in a standard way with minification  
  In this case, you need the tool `uglifyjs` which comes with nodeJS.

```
    samu -v
```

If you also want to change or add music glyphs, you may edit the source
file `font/abc2svg.sfd`. In this case, you will need both `base64` and `fontforge`,
and run

```
    samu -v font.js
```

### Batch

After building the **abc2svg** scripts, you will be able to generate music
sheets from the command line as you did with `abcm2ps`, thanks to the
following shell scripts (the result goes to stdout):  

- `abcjs24` with `js24` (Mozilla JavaScript shell - Spidermonkey)
- `abcjsc` with `jsc-1` (webkitgtk2)
- `abcnode` with `node` (nodeJS)
- `abcv8` with `d8` (Google libv8)

#### backend scripts

By default, the batch scripts generate (XHTML+SVG) files.   
This output may be modified by backend scripts. These ones must appear
just after the command.   
There are:

- `toabc.js`
  This script outputs back the (selected) ABC tunes of the ABC source file.   
  Transposition is applied.   
  The resulting file does not contain the formatting parameters.
  Example:

```
	abcjs24 toabc.js my_file.abc --select X:2 > tune_2.abc
```

- `toabw.js`
  This script outputs a Abiword file (ABW+SVG) which may be read by some
  word processors (abiword, libreoffice...) and converted to many other
  formats by the batch function of abiword.   
  The abc2svg music font (`abc2svf.woff` or `abc2svg.ttf`) must be installed
  in the local system for displaying and/or converting the .abw file.   
  Example:

```
	abcv8 toabw.js my_file.abc > my_file.abw
```

- `toodt.js`
  This script creates an Open Document (ODT+SVG) which may be read by most
  word processors (abiword, libreoffice...).   
  It runs only with the npm script `abc2svg` and asks for the npm module
  `jszip` to be installed.   
  The ODT document is created as `abc.odt` in the current directory.   
  Example:

```
	abc2svg toodt.js my_file.abc
```
