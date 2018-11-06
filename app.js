
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
//////////////////////////////
/* assign each socket a random id, then add socket to SOCKETS list */
io.sockets.on('connection', (socket) => {
    socket.id = Math.random();//random id for each socket
    socket.SAMPLEVARIABLE = "SAMPLE";
    SOCKETS[socket.id] = socket;
    Player.connect(socket);
    ////////////////////////
    // ON DISCONNECT EVENT//
    ////////////////////////
    socket.on('disconnect', () => {
        delete SOCKETS[socket.id];
        // Player.disconnect(socket); //not needed
        
        delete Player.list[socket.id];

    });

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
    Player.list[id] = self;
    return self;

}
Player.list = {}; //new method of holding the player list

Player.connect = (socket) => {
    var player = Player(socket.id);

    socket.on('keyPress', data => {
        if (data.inputId === 'ups')
            player.UP = data.state;

        else if (data.inputId === 'lefts')
            player.LEFT = data.state;
        else if (data.inputId === 'downs')
            player.DOWN = data.state;
        else if (data.inputId === 'rights')
            player.RIGHT = data.state;

    });
};
// Player.disconnect = socket =>{
//     delete Player.list[socket.id]; //not needed unless other is needed
// };

Player.move = () => {
    //box contains information (position) about everyplayer in the game and sends it to every other player.
    var box = [];
    for (var i in Player.list) {
        var player = Player.list[i];        //cnt do let socket = cuz used outside scope.
        player.move();
        box.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    return box;
}

setInterval(() => {

   var box = Player.move();

    
    for (var i in SOCKETS) {
        var socket = SOCKETS[i]
        socket.emit('updatePos', box);  //emit box to all client

    }


}, 1000 / 25);

