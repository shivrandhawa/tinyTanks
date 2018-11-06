var express = require('express');
var app = express();
var server = app.listen(2000);
app.use(express.static('client'))
console.log("My socket server is running");

//list of all the sockets connect
var SOCKETS = {}
// io object now has all functionalities of socket io library //
var io = require('socket.io')(server, {});




//////////////////////////////
// ON NEW CONNECTION //
//////////////////////////////
io.sockets.on('connection', (socket) => {

    console.log('new connection: ' + socket.id);
    socket.id = Math.floor(Math.random() * 10);//random id for each socket
    console.log('same connec ' + socket.id);
    socket.x = 0;              //socket x coord
    socket.y = 0;              //socket y coord;
    socket.SAMPLEVARIABLE = "SAMPLE"
    SOCKETS[socket.id] = socket;
    ////////////////////////////////////
    // PRACTICE EMIT AND RECIEVE CODE //
    ////////////////////////////////////
    socket.on('samplemessage', (data) => {
        console.log("sample emit recieved with msg: " + data.x);
    });

    //this will be displayed in the chrome console.
    socket.emit('msgfromserver',{
        x: 'sample var',
        y: 'sample var y',
    });


});



setInterval(() => {
   /*  for each socket update x and y, emit update 
   position with new x and y */
    for (var i in SOCKETS){
        let socket = SOCKETS[i];
        socket.x++;
        socket.y++;
        socket.emit('updatePos',{
            x:socket.x,
            y:socket.y,
        });
    }

}),1000/25;

