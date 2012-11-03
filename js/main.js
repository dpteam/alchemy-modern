// List of playable elements and elements in inventory
var playable = [];
var inventory = [];

// List of possible combos to create new elements
var combo = {
	'Air'   : { info: "An ancient classical element" },
	'Water' : { info: "An ancient classical element" },
	'Fire'  : { info: "An ancient classical element" },
	'Earth' : { info: "An ancient classical element" },
	
	'Mud' : { info: "It's muddy.", needs: [ 'Water', 'Earth' ] },
	'Steam' : { info: "Caution, may be hot", needs: [ 'Fire', 'Water' ] },
	'Energy' : { info: "You've got the power", needs: [ 'Air', 'Fire' ] },
	'Lava' : { info: "What have you done?!", needs: [ 'Earth', 'Fire' ] },
	'Cloud' : { info: "Up in the air", needs: [ 'Steam', 'Air' ] },
	
	// 'xx' : { info: "xx", needs: [ 'ww', 'zz' ] },

	/*
	'IBM'    : { info: 'the gigantic company' },
	'Hackers' : { info: 'People who code while others sleep' },
	'Coffee' : { info: 'Hackers need this' },
	'GUI'    : { info: 'Graphical User Interface. Because, the CLI sucks, sometimes' },
	'mud'    : { needs: [ 'water', 'earth' ], info: "it's muddy" },
	'boue'   : { needs: [ 'water', 'earth' ], info: "it's muddy" },
	'steam'  : { needs: [ 'water', 'fire' ], info: "it's very hot and can burn severely" },
	'chew'   : { needs: [ 'fire', 'air' ], info: "it's muddy" },
	'bubble' : { needs: [ 'air', 'chew' ], info: "it's muddy" },
	*/	
	
};

// Const
var ELEMENT_PROXIMITY = 10; // distance between 2 elements (in pixel) for them to be considered overlapping
var BODY_BGCOLOR = $('body').css( 'background-color' );
var BODY_BGCOLOR_DARK = '#5B5050';
var DEFAULT_INVENTORY = [ 'Air', 'Water', 'Fire', 'Earth' ];

var ELEM_HEIGHT = ELEM_WIDTH = '32px';

// Array of combo keys for faster parsing
var VALID_ELEMENTS = [];
for( var elem in combo ) {
	VALID_ELEMENTS.push( elem );
}


// Draggable options for elements in the play area
var dragged_twice = {
	stack: ".elem",
	drag: function( ev, ui ) {
		elem_toggle_body_bgcolor( ui.helper );
	},
	stop: function( ev, ui ) {
		// Delete if dragged outside, accept otherwise
		if( !elem_is_playable( ui.helper ) ) {
			elem_destroy( ui.helper );
		} else {
			elem_was_moved( ui.helper, $(ui.helper).attr('id') );
		}
	}
};

// Start everything
$(function() {
	elem_init_inventory();
	elem_init_draggable();
	elem_init_droppable();
	elem_update_inventory();
	elem_update_playable();
	elem_init_controls();
});

// Init controls
function elem_init_controls() {
	$('#reset').click(function(){

		$( '#play .elem' ).each( function( i, e ) {
			setTimeout(function(){
				elem_destroy( $(e) );
			}, 100*i);
		});	

	});
}


// Init draggables
function elem_init_draggable() {
	$("#inventory .elem").draggable({
		stack: ".elem",
		helper: 'clone',
		cursor: 'pointer',
		revert: "invalid",
		containment: '#game',
		stop: function( event, ui ) {
			// if validly dropped, clone dragged element
			if( elem_is_playable( ui.helper ) ) {
				var id = elem_new_id();
				var newdiv = $( ui.helper ).clone( true );
				$( newdiv ).attr( 'id', id ).appendTo( '#play' );
				$( newdiv ).draggable();
				$( newdiv ).draggable( 'option', dragged_twice );
				elem_was_moved( newdiv, id );
			}
		},
		start: function( ev, ui ) {
			$(ui.helper).css('z-index', 10000 );
		},
		drag: function( ev, ui ) {
		
		}
	});
}


// Init droppable
function elem_init_droppable() {
	$( "#play" ).droppable({
		accept: "#game div.elem",
		stack: ".elem",
		tolerance: 'fit',
		drop: function( event, ui ) {

		}
	});
}

// Bind body color and element playability
function elem_toggle_body_bgcolor( elem ) {
	if( elem_is_playable( elem ) ) {
		$('body').css('background-color', BODY_BGCOLOR );
	} else {
		$('body').css('background-color', BODY_BGCOLOR_DARK );
	}
}

// Return random ID
function elem_new_id() {
	return ( 'id_' + Math.floor(Math.random()*1000000) );
}

// An element was moved. Performs checks.
function elem_was_moved( el, id ) {

	// Check if element has an id (not sure why it's not passed the 1st time...)
	if( $(el).attr('id') == null && id != null ) {
		$(el).attr( 'id', id );
	}
	
	// Update list of playable elements
	elem_update_playable();
	// var all = []; $(playable).each(function(i,e){all.push( e.name );} );console.log( all.toString() );

	// Current object coordinates
	var p = $(el).position();
	var top  = parseInt( p.top );
	var left = parseInt( p.left );
	
	// Check if element dropped on another one
	$( playable ).each( function( i, e ) {
		// compare dropped element with all others
		if( e.id != id ) {
			if( Math.abs( parseInt( top - e.top ) ) <= ELEMENT_PROXIMITY && Math.abs( parseInt( left - e.left ) ) <= ELEMENT_PROXIMITY ) {

				// We have an overlap. Is it a combo ?
				var new_elem = elem_is_combo( elem_get_name( el ), e.name );
				if( new_elem.length >= 1 ) {

					// Spring new element(s)
					$( new_elem ).each( function( i, e ) {
						setTimeout(function(){
							elem_add_to_play( e, top, left );
						}, 300*i);
					});
					
					// Destroy the two elements
					$( $('#'+e.id) ).hide("puff", {}, 500);
					elem_destroy( $( '#'+e.id ) );
					$( $('#'+id) ).hide("puff", {}, 500);
					elem_destroy( $('#'+id) );
					
					// Add new element(s) to inventory
					$( new_elem ).each( function( i, e ) {
						if( !elem_in_inventory( e ) ) {
							setTimeout(function(){
								elem_add_to_inventory( e );
							}, 300*i);
						}
					});
				}
			}
		}
	});
}

// Add new element to playground
function elem_add_to_play( new_elem, top, left ) {
	top = top + elem_return_random( 30, 10 );
	left = left + elem_return_random( 30, 10 );
	var newdiv = $( '<div style="display:none" class="elem elem_' + new_elem + '">' + new_elem + '</div>' )
	$(newdiv).appendTo( '#play' );
	$(newdiv).css({ top: top, left: left, position: "absolute" }).draggable();
	$(newdiv).draggable( "option", dragged_twice );
	$(newdiv).attr( "id", elem_new_id() );
	$(newdiv).effect("bounce", { times:3 }, 300).fadeIn('slow');
	elem_update_playable();
}

// Add new element to inventory
function elem_add_to_inventory( new_elem ) {
	var newdiv = elem_add_new_div_to_inventory( new_elem );
	elem_init_draggable();
	$(newdiv).show("drop", { direction: "up" }, 1000);
	elem_update_inventory();
	elem_update_fragment( new_elem );
}

// Guess inventory from fragment
function elem_init_inventory() {
	var frag = elem_decode( document.location.hash );
	inventory = DEFAULT_INVENTORY;
	if( frag != '' ) {
		$( frag.split(',') ).each(function(i,e){
			//console.log (e, $.inArray( e, VALID_ELEMENTS )
			if( $.inArray( e, VALID_ELEMENTS ) >= 0 ) {
				inventory.push( e );
			}
		});
	}
	// Draw inventory
	$( inventory ).each(function(i,e){
		var newdiv = elem_add_new_div_to_inventory( e );
		setTimeout(function(){
			$(newdiv).show("drop", { direction: "up" }, 500);
		}, 60*i);
	});
}

// Add a new (hidden) div element to the inventory
function elem_add_new_div_to_inventory( name ) {
	var html_name = name.replace(/ /, '_');
	var newdiv = $( '<div style="display:none" class="elem elem_' + html_name + '">' + name + '</div>' )
	$('#divclear').before( newdiv );
	return( newdiv );
}


// Update URL fragment with new elem
function elem_update_fragment( elem ) {
	var hash = elem_decode( document.location.hash );
	if( hash !== '' ) {
		hash = hash + ',' ;
	}
	document.location.hash = elem_encode( hash + elem );
}

// Encrypt/compress string
function elem_encode( str ) {
	// return lzw_encode( Base64.encode ( str ) );
	return ( Base64.encode ( str ) );
}

// Decrypt/uncompress string
function elem_decode( str ) {
	// return lzw_decode( Base64.decode ( str ) );
	return ( Base64.decode ( str ) );
}


// Check if element already in inventory
function elem_in_inventory( elem ) {
	return ( $.inArray( elem, inventory ) > -1 );
}


// Return inventory
function elem_update_inventory() {
	// Update global array
	inventory = [];
	$('#inventory .elem').each( function( i, e ) {
		inventory.push( elem_get_name( e ) );
	});
	// Add tooltips
	$("#inventory .elem").tooltip();
}


// Check if two elements make a combo
function elem_is_combo( elem1, elem2 ) {
	var test_combo = [ elem1, elem2 ];

	var elems = [];
	for( var elem in combo ) {
		// Compare 2 arrays: http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays
		if( $(combo[elem].needs).not(test_combo).length == 0 && $(test_combo).not(combo[elem].needs).length == 0 ) {
			elems.push( elem );
		}
	}
	return( elems );
}

// Return random number, positive or negative, abs value between max and min
function elem_return_random( max, min ) {
	min = ( min == null ? 0 : parseInt( min ) );
	max = parseInt( max - min );
	var sign = [ 2 * Math.floor( Math.random() * 2 ) -1 ]; // 1 or -1
	var num  = [ Math.floor( Math.random()* max + min ) ];
	return( parseInt( sign * num ) );
}


// Destroy an element, in a bit fancy way
function elem_destroy( el ) {
	el.animate(
		// properties 
		{ 	height: parseInt( el.height() / 4 ) + 'px',
			width: parseInt( el.width() / 4 ) + 'px',
			opacity: 0.1,
			borderSpacing: elem_return_random( 290, 10 )
		}, 
		// options
		{ 	duration: 400, 
			easing: "linear",
			step: function( now,fx ) {
				$(this).css('-webkit-transform','rotate('+now+'deg)');
				$(this).css('-moz-transform','rotate('+now+'deg)'); 
				$(this).css('transform','rotate('+now+'deg)');  
			},
			complete: function() {
				$( el ).remove();
				elem_update_playable();
				$('body').css( 'background-color', BODY_BGCOLOR )
			}
		}
	);
}


// Verify if an element has been dropped in the play area and return true if so
function elem_is_playable( el ) {
	// dropped element
	var p = $(el).position()
	var top  = parseInt( p.top );
	var left = parseInt( p.left );
	var width = $(el).width();
	var height = $(el).height();
	
	// play area
	p = $('#play').position();
	var play_top  = p.top;
	var play_left = p.left;
	var play_width = $('#play').width();
	var play_height = $('#play').height();
	
	// check if element is inside play area
	return(
		   ( play_top + 10 ) <= top
		&& ( play_left ) <= left
		&& ( ( play_top + play_height + 15 ) >= ( top + height ) )
		&& ( ( play_left + play_width + 10 ) >= ( left + width ) )
	);
}

// Update a global array of all playable elems and their coordinates
function elem_update_playable() {
	playable = [];
	$('#play .elem').each( function( i, e ) {
		var name = elem_get_name( e );
		var p = $(e).position()
		var top = parseInt( p.top );
		var left = parseInt( p.left );
		var id = $(e).attr( 'id' );
		playable.push( { id: id, name: name, top: top, left: left } );
	});
}


// Get element name
function elem_get_name( el ) {
	var name = $( el ).attr('class');
	var matches = name.match(/elem_(\S+)\s+/);
	name = matches[1].replace(/_/, ' ');
	return ( name );
}


$.fn.wait = function(time, type) {
	time = time || 1000;
	type = type || "fx";
	return this.queue(type, function() {
		var self = this;
		setTimeout(function() {
			$(self).dequeue();
		}, time);
	});
};

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
}

/**
*
*  LZW encode / decode
*  http://stackoverflow.com/a/294421/36850
*
**/

// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}
