
var express = require('express');
var app = express();
var server = app.listen(2000);


app.get('/', function (req, rep) {
    rep.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
console.log("My socket server is running");

var SOCKETS = {}; //list of all the sockets connect

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
        lives: 10,
    }
    self.move = () => {
        self.moveUnit();
    }
    self.moveUnit = () => {
        self.x += self.xspeed
        self.y += self.yspeed

    }
    self.dis = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }

    return self;
};


//////////////////
// BULLET OBJECT//
//////////////////

var Bullets = (parent, angle) => {
    var self = Thing();
    self.id = Math.random();
    self.xspeed = Math.cos(angle / 180 * Math.PI) * 10;
    self.yspeed = Math.sin(angle / 180 * Math.PI) * 10;
    self.expire = 0;
    self.parent = parent;
    self.remove = false;
    var su_update = self.move;

    //override to remove the bullet - THINGS dont get removed
    self.move = () => {
        if (self.expire++ > 100)
            self.remove = true;
        su_update();

        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.dis(p) < 32 && self.parent !== p.id) {
                // console.log('====================================');
                // console.log(p.id + ':' + [self.parent.points]);


                Player.list[p.id].lives--;
                if (Player.list[p.id].lives <= 0)
                    Player.list[p.id].remove = true;

                console.log('player:' + p.id + "has been shot, lives left:" + Player.list[p.id].lives)

                    ;
                // console.log('====================================');
                self.remove = true;
            }
        }

    }
    Bullets.list[self.id] = self;
    return self;
}
Bullets.list = {};

Bullets.move = () => {
    //box contains information (position) about everyplayer in the game and sends it to every other player.
    var box = [];
    for (var i in Bullets.list) {
        var bullet = Bullets.list[i];   //cnt do let socket = cuz used outside scope.
        bullet.move();
        if (bullet.remove)
            delete Bullets.list[i];
        else
            box.push({
                x: bullet.x,
                y: bullet.y,
            });
    }
    return box;
}



//////////////////
// PLAYER OBJECT //
//////////////////
var Player = function (id) {
    var self = Thing();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.LEFT = false;
    self.ATK = false;
    self.mAng = 0; //HERERERE
    self.RIGHT = false;
    self.re = false;
    self.DOWN = false;
    self.UP = false;
    self.move_speed = 10;
    self.lives = 5;
    self.name = "shiv"

    var su_update = self.move;
    self.move = function () {
        self.moveUnit();
        su_update();
        if (self.ATK) {
            setTimeout(() => {
                self.shoot(self.mAng);
            }), 500 / 25;

        }
        for (var i in Player.list) {
            if (self.lives == 0) {
                console.log('====================================');
                console.log(self.re);
                console.log('====================================');
                self.re = true;
                delete Player.list[self.id];
                for (var i in SOCKETS) {
                    SOCKETS[i].emit('displayMsg', "PLAYER ELIMINATED")
                }
            }
        }
    }
    self.shoot = angle => {
        var bulls = Bullets(self.id, angle)

        bulls.x = self.x;
        bulls.y = self.y;

    }

    // self.draw =() => {
    //     var hpWidth = 3
    //     ctx.fillRect(self.x - hpWidth/2,self.y -40,hpWidth,4)
    // }

    self.moveUnit = () => {
        if (self.RIGHT)
            self.x += self.move_speed;
        if (self.LEFT)
            self.x -= self.move_speed;
        if (self.UP)
            self.y -= self.move_speed;
        if (self.DOWN)
            self.y += self.move_speed;
    }
    Player.list[id] = self;
    return self;
};
Player.list = {}; //new method of holding the player list
Player.connect = (socket) => {
    var player = Player(socket.id);
    console.log('====================================');
    console.log(player.id);
    console.log('====================================');
    socket.on('keyPress', data => {
        if (data.inputId === 'ups')
            player.UP = data.state;
        else if (data.inputId === 'lefts')
            player.LEFT = data.state;
        else if (data.inputId === 'downs')
            player.DOWN = data.state;
        else if (data.inputId === 'rights')
            player.RIGHT = data.state;
        else if (data.inputId === 'atk')
            player.ATK = data.state;
        else if (data.inputId === 'mAng')
            player.mAng = data.state;

    });
};

Player.move = () => {
    //box contains information (position) about everyplayer in the game and sends it to every other player.
    var box = [];
    for (var i in Player.list) {
        var player = Player.list[i];        //cnt do let socket = cuz used outside scope.
        player.move();
        box.push({
            x: player.x,
            y: player.y,
            number: player.number,
            lives: player.lives,
        });
    }
    return box;
};
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
    //// sendmsg Event /////
    ////////////////////////
    socket.on('sendMsg', (data) => {
        var sender = "id:" + (" " + socket.id);
        for (var i in SOCKETS) {
            SOCKETS[i].emit('displayMsg', sender + ' - ' + data)
        }
    });

    socket.on('command', data => {
        socket.emit('clientCom', (eval(data)));
    })


    socket.on('namer', data => {
        socket.name = 'shiv'
        socket.emit('clientCom', (eval(data)));
        console.log('====================================');
        // console.log(self.name = (eval(data)));
        console.log('====================================');
    })


    ////////////////////////
    // ON DISCONNECT EVENT//
    ////////////////////////
    socket.on('disconnect', () => {
        delete SOCKETS[socket.id];
        // Player.disconnect(socket); //not needed

        delete Player.list[socket.id];

    });

});


// Player.disconnect = socket =>{
//     delete Player.list[socket.id]; //not needed unless other is needed
// };



setInterval(() => {

    var box = {
        player: Player.move(),
        bullet: Bullets.move()
    }

    for (var i in SOCKETS) {
        var socket = SOCKETS[i]
        socket.emit('updatePos', box);  //emit box to all client

    }

}, 1000 / 25);

