
var PORT = process.env.PORT || 2000;
var mongojs = require("mongojs");
//creates connection to the database
var db = mongojs('mongodb://shiv:master1@ds263493.mlab.com:63493/tinytanksdb', ['account', 'score']);
// db.account.insert({ username: "guest", password: "guest" });

var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function (req, rep) {
    rep.sendFile(__dirname + '/index.html');
});


//gets all the documents in the account collection
app.get('/api/users', function (req, res) {
    db.account.find(function (err, docs) {
        //hardcoded apptoken
        var token = req.headers['apptoken'];
        var userid = req.headers['userid'];

        /* var newtest = JSON.stringify(docs)
        var new2 = JSON.parse(newtest) */
        var output = docs.map(s => Object.values(s)[1]);
        res.send(output);

        //res.send((token + "::" + userid));         //docs is an array of all documents in the 'account' collection 

    })
});

//get all document of user with :name param
// app.get('/api/users/:name', function (req, res) {
//     //hardcoded apptoken
//     var token = req.headers['apptoken'];
//     var userid = req.headers['userid'];
//     db.account.find({ username: req.params.name }, function (err, docs) {
//         res.send(docs);
//         //TODO: handle 404 status errors
//     })
// });


//post specifc users score - using api headers
app.post('/api/users/score', function (req, res) {
    //hard coded token 
    var token = req.headers['authorization'];
    var userid = req.headers['userid'].toLowerCase();
    //ingame name
    var ign = userid.substr(0, userid.indexOf("badge"))
    db.account.find({ username: ign }, function (err, docs) {
        var jsonObj = {
            "text": "tanks score: " + docs[0].score,
            "link": "https://tiny-tanks.herokuapp.com/",
            "icon-url": "tanksicon.png"
        };
        res.send(jsonObj);

    });
});

app.post('/api/users/landing', function (req, res) {
    //hard coded token 
    var token = req.headers['authorization'];
    var userid = req.headers['userid'].toLowerCase();
    //ingame name
    var ign = userid.substr(0, userid.indexOf("badge"))
    db.account.find({ username: ign }, function (err, docs) {
        var jsonObj = {
            "text": "tanks score: " + docs[0].score,
            "link": "https://tiny-tanks.herokuapp.com/",
            "icon-url": "tanksicon.png"
        };
        res.send(jsonObj);

    });
});

app.use('/client', express.static(__dirname + '/client'));
console.log("My socket server is running");

server.listen(PORT);

var SOCKETS = {}; //list of all the sockets connect

var USERS = {
    //username:password
    "bob": "asd",
    "shiv": "shiv",
    "bob2": "bob",

};

var isUsernameTaken = (data, cb) => {
    db.account.find({ username: data.username }, function (err, res) {
        if (res.length > 0)
            cb(true);
        else
            cb(false);
    });
}

var addUser = (data, cb) => {
    db.account.insert({ username: data.username, password: data.password }, function (err, res) {
        if (res.length > 0)
            cb(true);
        else
            cb(false);
    });
};
var isValidPass = (data, cb) => {
    db.account.find({ username: data.username, password: data.password }, function (err, res) {
        if (res.length > 0)
            cb(true);
        else
            cb(false);
    });
}
//////////////////
// THING OBJECT //
//////////////////
var Thing = function () {
    var self = {
        x: 250,  //center of play area
        y: 250,
        id: "",
        xspeed: 0,
        yspeed: 0,
        lives: 10,
    }
    self.move = () => {
        self.moveUnit();
    }
    self.moveUnit = () => {
        self.x += self.xspeed;
        self.y += self.yspeed;

    }
    self.dis = function (k) {
        return Math.sqrt(Math.pow(self.x - k.x, 2) + Math.pow(self.y - k.y, 2));
    };
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
            if (self.dis(p) < 20 && self.parent !== p.id) {
                // console.log('====================================');
                // console.log(p.id + ':' + [self.parent.points]);
                Player.list[p.id].lives--;
                if (Player.list[p.id].lives === 0) {
                    Player.list[p.id].remove = true;
                    Player.list[self.parent].score++;
                    db.account.update({ username: Player.list[self.parent].name }, { $set: { score: Player.list[self.parent].score } });
                }
                // console.log('player: ' + p.id + "has been shot, lives left:" + Player.list[p.id].lives);
                //  console.log("player: " + self.parent + "points:  " + Player.list[self.parent].score);

                self.remove = true;
            }
        }
    };
    Bullets.list[self.id] = self;
    return self;
};
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
    self.mAng = 0;
    self.RIGHT = false;
    self.remove = false;
    self.DOWN = false;
    self.UP = false;
    self.move_speed = 10;
    self.lives = 5;
    self.score = 0;
    self.name = "no_name";

    var su_update = self.move;
    self.move = function () {
        self.moveUnit();
        su_update();
        if (self.ATK) {
            //timeout function not implemented properly/
            self.shoot(self.mAng);


        }
        for (var i in Player.list) {
            if (self.lives == 0) {
                self.remove = true;
                delete Player.list[self.id];
                for (var i in SOCKETS) {
                    SOCKETS[i].emit('displayMsg', "PLAYER ELIMINATED")
                }
            }
        }
    };
    self.shoot = angle => {
        var bulls = Bullets(self.id, angle);
        bulls.x = self.x;
        bulls.y = self.y;

    };
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
    socket.on('press_key', data => {
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
            score: player.score,
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

    socket.on('signin', (data) => {
        isValidPass(data, function (res) {
            if (res) {

                Player.connect(socket);
                Player.list[socket.id].name = data.username;
                socket.emit('signin-res', { success: true });

            } else {
                socket.emit('signin-res', { success: false });

            }
        });
    });
    socket.on('signup', (data) => {
        isUsernameTaken(data, function (res) {
            if (res) {
                socket.emit('signup-res', { success: false });
            } else {
                addUser(data, function () {
                    socket.emit('signup-res', { success: true });

                })
            }
        })
    });
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
        // socket.emit('clientCom', (eval(data)));
        socket.id = data;   //cahnges the socket id to the entered value
        // console.log(self.name = (eval(data)));
    });

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

