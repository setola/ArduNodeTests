/**
 * Resources init
 */

var express	= require('express');
var app			= express();
var fs			= require('fs');
var jade		= require('jade');
var http		= require('http');
var server	= http.createServer(app);
var io			= require('socket.io').listen(server);
var arduino	= require('duino');
var board		= new arduino.Board({ 
	debug: true,
	device: 'ACM'
});
var leds		= {
		r: new arduino.Led({
		  board: board,
		  pin: 3
		}),
		g: new arduino.Led({
			board: board,
			pin: 5
		}),
		b: new arduino.Led({
		  board: board,
		  pin: 6
		}),
		w: new arduino.Led({
		  board: board,
		  pin: 13
		})
};

var socket_io_server_port = 3000;

//wait for arduino for set socked io up and running
board.on('ready', function(){
	console.log('Arduino READY');
	server.listen(socket_io_server_port);
});

/**
 * Multiple configurations
 */
app.configure(function(){
	app.set('htitle', 'SetoLan');
	app.set('title', 'Welcome to SetoLan');
	app.set('subtitle', 'a.k.a. Setola\' playground');
	app.set('base url', 'http://setolan.dyndns.org');
	app.set('default nav', 
		[
		 { 
			 href:app.get('base url')+'/', 
			 label:'Home', 
			 title:'Go Home!' 
		 },
		 { 
			 href:app.get('base url')+':9093/', 
			 label:'aMule', 
			 title:'aMule Server' 
		 },
		 { 
			 href:app.get('base url')+':9091/', 
			 label:'Torrent', 
			 title:'Torrent Server' 
		 },
		 { 
			 href:app.get('base url')+'/arduino', 
			 label:'Arduino', 
			 title:'Arduino Playground' 
		 },
		 { 
			 href:'http://www.emanueletessore.com', 
			 label:'Author', 
			 title:'The Author\'s Page' 
		 }
	]);
	app.engine('jade', require('jade').__express);
	app.set('views', __dirname + '/views');
});

/**
 * development only
 */
app.configure('development', function(){
	app.set('title', 'Welcome to SetoLan - Development');
});

/**
 * production only
 */
app.configure('production', function(){
	app.set('title', 'Welcome to SetoLan - Production');
});

















/**
 * Main page
 */
app.get('/', function(req, res){
  res.render('index.jade', {
  	htitle: app.get('htitle'),
  	title: app.get('title'),
  	subtitle: app.get('subtitle'),
  	nav:app.get('default nav')
  });
});


/**
 * Arduino page
 */
app.get('/arduino', function(req, res){

	io.sockets.on('connection', function (socket) {
		var status = {};
		for (led in leds){
			status[led] = leds[led].bright;
		}
		socket.emit('led', { 
			rgb: status, 
			hex: calc_hex(status.r, status.g, status.b) 
		});
		
		socket.on('led', function(data){
			console.log(data);
			var variations = { rgb: {}};
			var add_hex = false;
			if('undefined' != typeof(data.hex)){
				var rgb_arr = data.hex.split('');
				console.log(rgb_arr);
				console.log(rgb_arr.length);
				switch(rgb_arr.length){
				case 6:
					data.rgb = {};
					data.rgb.r = rgb_arr[0].toString()+rgb_arr[1].toString();
					data.rgb.g = rgb_arr[2].toString()+rgb_arr[3].toString();
					data.rgb.b = rgb_arr[4].toString()+rgb_arr[5].toString();
					break;
				case 3:
					data.rgb = {};
					data.rgb.r = rgb_arr[0].toString()+rgb_arr[0].toString();
					data.rgb.g = rgb_arr[1].toString()+rgb_arr[1].toString();
					data.rgb.b = rgb_arr[2].toString()+rgb_arr[2].toString();
					break;
					default:
						// KABOOM
				};
				delete data.hex;
			}

			for (led in data.rgb){
				var new_bright = parseInt(data.rgb[led],16);
				
				if(new_bright != status[led]){
					console.log(led);
					leds[led].brightLevel(new_bright);
					status[led] = leds[led].bright; //hardware check
					variations.rgb[led] = status[led];
					if(['r','g','b'].indexOf(led)!=-1){
						add_hex = true;
					}
				}
			}
			if(add_hex){
				variations.hex = calc_hex(status.r, status.g, status.b);
			}
			io.sockets.emit('led', variations);
		});
		
		
		
	});
	
  res.render('arduino.jade', {
  	htitle: app.get('htitle'),
  	title:  'Arduino Testing Page',
  	subtitle: 'a.k.a. Ardu-playground :)',
  	nav:app.get('default nav'),
  	socketio:{
  		port:socket_io_server_port,
  		lib_src:app.get('base url')+':'+socket_io_server_port+'/socket.io/socket.io.js'
  	}
  });
});

function hex2string(hex){
	var toret = hex.toString(16);
	if(hex == 0) toret = "0" + toret;
	return toret;
}

function calc_hex(r, g, b){
	return hex2string(r)
	+ hex2string(g)
	+ hex2string(b);
}

app.listen(80);

