//#javascript
// Generate a JSON representation of ABC
//
// Copyright (C) 2016 Jean-Francois Moine
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.

// Usage:
//	// Define a get_abcmodel() callback function
//	// This one is called by abc2svg after ABC parsing 
//	user.get_abcmodel = json_callback
//
//	// In this function
//	function json_callback(tsfirst, voice_tb, music_types, info) {
//
//		// Create a AbcJSON instance
//		var abcjson = new AbcJSON();
//
//		// and generate the ABC representation
//		json += abcjson.gen_json(tsfirst, voice_tb, anno_type, info);
//	}
//
//	// result
//	var json = ''

// AbcJSON creation
function AbcJSON(nindent) {			// indentation level
	var inb = Array((nindent || 2) + 1).join(' ') // indentation base

    this.gen_json = function (tsfirst, voice_tb, anno_type, info) {
	var	json, i, j, l, v, s, h,
		ind2 = inb + inb,
		ind3 = ind2 + inb,
		ind4 = ind3 + inb,
		links = {
			next: true,
			prev: true,
			ts_next: true,
			ts_prev: true,
			extra: true,
			p_v: true,
			dd_st: true
		}
	// generate an attribute
	function attr_gen(ind, attr, val) {
		var	i, e,
			indn = ind + inb	// next indentation

		if (links[attr]) {
			if (attr == "extra") {
				json += h + ind + '"extra": [';
				h = '\n'
				for (e = val ; e; e = e.next)
					attr_gen(indn, null, e);
				json += '\n' + ind + ']'
			}
			return
		}
		json += h + ind
		if (attr)
			 json += '"' + attr.toString() + '": ';
		switch (typeof(val)) {
		case "undefined":
			json += "null"
			break
		case "object":
			if (!val) {
				json += "null"
				break
			}
			if (Array.isArray(val)) {
				if (val.length == 0) {
					json += "[]"
					break
				}
				h = '[\n';
				l = val.length
				for (i = 0; i < l; i++)
					attr_gen(indn, null, val[i]);
				json += '\n' + ind + ']'
			} else {
				h = '{\n'
				for (i in val)
				    if (val.hasOwnProperty(i))
					attr_gen(indn, i, val[i]);
				json += '\n' + ind + '}'
			}
			break
		default:
			json += JSON.stringify(val)
			break
		}
		h = ',\n'
	} // attr_gen()

	// music types
	json = '';
	h = '{\n';
	attr_gen(inb, "music_types", anno_type);

	h = ',\n' + inb + '"music_type_ids": {\n';
	l = anno_type.length
	for (i = 0; i < l; i++) {
		if (anno_type[i]) {
			json += h + ind2 + '"' + anno_type[i] + '": ' + i;
			h = ',\n'
		}
	}

	// info
	h = '\n' + inb + '},\n';
	attr_gen(inb, "info", info);

	// voices
	json += ',\n' + inb + '"voices": [';
	v = 0;
	h = '\n'
	while (1) {
		h += ind2 + '{\n' +
			ind3 + '"voice_properties": {\n'
		for (i in voice_tb[v])
		    if (voice_tb[v].hasOwnProperty(i))
			attr_gen(ind4, i, voice_tb[v][i]);

		json += '\n' + ind3 + '},\n' +
			ind3 + '"symbols": [';
		s = voice_tb[v].sym
		if (!s) {
			json += ']\n' + ind3 + '}'
		} else {
			h = '\n'
			for ( ; s; s = s.next)
				attr_gen(ind4, null, s);
			json += '\n' + ind3 + ']\n' +
				ind2 + '}'
		}
		h = ',\n'
		if (!voice_tb[++v])
			break
	}
	return json + '\n' + inb + ']\n}\n'
    }
}
