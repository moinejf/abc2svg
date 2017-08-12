// abc2svg - cmdline.js - command line
//
// Copyright (C) 2014-2017 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// global variables
var errtxt = ''

// -- replace the exotic end of lines by standard ones
function set_eoln(file) {
	var i = file.indexOf('\r')
	if (i < 0)
		return undefined	// standard
	if (file[i + 1] == '\n')
		return file.replace(/\r\n/g, '\n')	// M$
	return file.replace(/\r/g, '\n')		// Mac
}

// -- abc2svg init argument
var user = {
	read_file: function(fn) {	// include a file (%%abc-include)
		var	file = readFile(fn),
			file2 = set_eoln(file)
		return file2 || file
	},
	errmsg: function(msg, l, c) {	// get the errors
		if (typeof printErr == 'function')
			printErr(msg)
		else
			errtxt += msg + '\n'
	}
}

var	abc = new Abc(user)		// (global for 'toxxx.js')

function do_file(fn) {
	var	file = user.read_file(fn)

	if (!file) {
		j = fn.lastIndexOf("/")
		if (j < 0)
			j = 0;
		i = fn.indexOf(".", j)
		if (i < 0) {
			fn += ".abc";
			file = user.read_file(fn)
		}
	}
	if (!file)
		abort(new Error("Cannot read file '" + fn + "'"))
//	if (typeof(utf_convert) == "function")
//		file = utf_convert(file)
	try {
		abc.tosvg(fn, file)
	}
	catch (e) {
		abort(e)
	}
}

function abc_cmd(cmd, args) {
	var	arg, parm, fn;

	abc_init()
	while (1) {
		arg = args.shift()
		if (!arg)
			break
		if (arg[0] == "-") {
			if (arg[1] == "-") {
				parm = args.shift();
				abc.tosvg(cmd, arg.replace('--', 'I:') +
						" " + parm + "\n")
			}
		} else {
			if (fn) {
				do_file(fn);
				abc.tosvg('cmd', '%%select\n')
			}
			fn = arg
		}
	}
	if (fn)
		do_file(fn);

	abc_end()
}

// nodejs
if (typeof module == 'object') {
	exports.abc = abc;
	exports.errtxt = errtxt;
	exports.user = user;
	exports.abc_cmd = abc_cmd
}
