var express = require ('express');

var app = express();

var server = app.listen(2000);


app.use(express.static('client'))
console.log("My socket server is running");

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log('new connection: ' + socket.id);
}