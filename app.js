
var express = require('express');
var app = express();
var server = app.listen(2000);
app.use(express.static('client'))
console.log("My socket server is running");

var SOCKETS = {}; //list of all the sockets connect
var PLAYERS = {}; //list of all players
// io object now has all functionalities of socket io library //
var io = require('socket.io')(server, {});

//////////////////////////////
// ON NEW CONNECTION //
/* assign each socket a random id, then add socket to SOCKETS list */
io.sockets.on('connection', (socket) => {
    socket.id = Math.random();//random id for each socket
    socket.SAMPLEVARIABLE = "SAMPLE";
    SOCKETS[socket.id] = socket;
    //create player with the socketid:
    var player = Player(socket.id);
    PLAYERS[socket.id] = player;

    ////////////////////////
    // ON DISCONNECT EVENT//
    ////////////////////////
    socket.on('disconnect', () => {
        delete SOCKETS[socket.id];
        delete PLAYERS[socket.id];

    });

    socket.on('keyPress', data => {
        if (data.inputId === 'ups') {
            player.UP = data.state;

        }
        else if (data.inputId === 'lefts')
            player.LEFT = data.state;
        else if (data.inputId === 'downs')
            player.DOWN = data.state;
        else if (data.inputId === 'rights')
            player.RIGHT = data.state;

    })

});

//////////////////
// THING OBJECT //
//////////////////
var Thing = function () {
    var self = {
        x: 250,  //center of play area
        y: 250,
        id: " ",
        xspeed: 0,
        yspeed: 0,
    }
    self.move = () => {
        self.moveUnit();
    }
    self.moveUnit = () => {
        self.x += self.xspeed
        self.y += self.yspeed

    }
    return self;
}


//////////////////
// PLAYER OBJECT //
//////////////////
var Player = function (id) {
    var self = Thing();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.LEFT = false;
    self.RIGHT = false;
    self.DOWN = false;
    self.UP = false;
    self.maxSpd = 10; //TODO: change var


    var su_update = self.move;
    self.move = () => {
        self.moveUnit();
        su_update(); //TODO: change var
    }

    self.moveUnit = () => {
        if (self.RIGHT)
            self.x += self.maxSpd;
        if (self.LEFT)
            self.x -= self.maxSpd;
        if (self.UP)
            self.y -= self.maxSpd;
        if (self.DOWN)
            self.y += self.maxSpd;
    }
    return self;

}





setInterval(() => {
    //box contains information (position) about everyplayer in the game and sends it to every other player.
    var box = [];
    for (var i in PLAYERS) {
        var player = PLAYERS[i];        //cnt do let socket = cuz used outside scope.
        player.moveUnit();
        box.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    for (var i in SOCKETS) {
        var socket = SOCKETS[i]
        socket.emit('updatePos', box);  //emit box to all client

    }


}, 1000 / 25);

