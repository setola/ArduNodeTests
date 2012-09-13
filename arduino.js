var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var arduino = require('duino');
var board = new arduino.Board({ 
	debug: true 
});
var led = new arduino.Led({
  board: board,
  pin: 13
});

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
	socket.emit('status',{ status: led.bright });
  socket.on('my other event', function (data) {
    console.log(data);
  });
	socket.on('led on', function (data) {
		console.log(data);
		led.on();
		io.sockets.emit('status',{ status: led.bright });
	});
	socket.on('led off', function (data) {
  	console.log(data);
  	led.off();
  	io.sockets.emit('status',{ status: led.bright });
	});
});
