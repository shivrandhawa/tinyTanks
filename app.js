var express = require('express');
var app = express();
var server = app.listen(2000);
app.use(express.static('client'))
console.log("My socket server is running");


// io object now has all functionalities of socket io library //
var io = require('socket.io')(server, {});




//////////////////////////////
// ON NEW CONNECTION //
//////////////////////////////
io.sockets.on('connection', (socket) => {


    console.log('new connection: ' + socket.id);

    socket.on('samplemessage', (data) => {
        console.log("sample emit recieved with msg: " + data.x);
    });

    socket.emit('msgfromserver',{
        x: 'sample var',
        y: 'sample var y',
    });


});

