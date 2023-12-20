const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
// setting up the WebSocket!
const WebSocket = require('ws')
const socket = new WebSocket.Server({ port: 8008 })
const rel = "./user_data.json"
const fs = require("fs")
const bcrypt = require('bcrypt'); //help!
const saltRounds = 10; // idk the wiki said to do this 
const maxGameCapacity = 15; //maximum amount of players per game

function writeData(data, username = null, info1 = null, info2 = null){ //username/info1/info2 are for finding path to data
    let json = readData()

    if (username == null){ //trying to create new file (old one was destroyed)
        json = data
    } else if (info1 == null){ //trying to create new user
        json[username] = data
    } else if (info2 == null){ //trying to change entire attribute of user profile (i.e friends list, pwd)
        json[username][info1] = data
    } else { //trying to change one aspect of user profile (i.e. track 6 pb)
        json[username][info1][info2] = data
    }

    //formatting taken from https://stackoverflow.com/questions/71091649/add-newline-after-each-key-value-using-json-stringify
    fs.writeFileSync(rel, JSON.stringify(json, null, "\t").replaceAll("],\n\t\"", "],\n\n\t\""))
}

function readData(username = null, info1 = null, info2 = null){ //returns json
    let users
    try { //read synchronously
        users = JSON.parse(fs.readFileSync(rel))
    } catch (error) { //if file doesnt exist
        fs.writeFileSync(rel, '{}') //make a new file with "{}"
        users = {}
    }

    //get the data they want
    if (username == null){ //trying to create new file (old one was destroyed)
        return users
    } else if (info1 == null){ //trying to create new user
        return users[username]
    } else if (info2 == null){ //trying to change entire attribute of user profile (i.e friends list, pwd)
        return users[username][info1]
    } else { //trying to change one aspect of user profile (i.e. track 6 pb)
        return users[username][info1][info2]
    }
    
}

//try to read user_data.json. if not, create a new empty file
let users = readData()


// object containing all the running games 
let games = {}
// object containing all he chat messages. max len of like 100 lets say. newest at the end. 
//let chats = [] //I MOVED THIS TO CHAT.JS.... IF U NEED IT FOR SERVER STUFF USE A DIFFERENT NAME!!!!
// object containing the game codes so no dupplicates
let gameCodes = []
// Serve the static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// all get paths
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/signup.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "/public/login.html"))
})
app.get("/menu", (req, res) => {
    res.sendFile(__dirname+"/public/menu.html")
})

app.get("/track1", (req, res) => {
    res.sendFile(path.join(__dirname, '/public/track.html'));
});

app.get("/globalVars.js", (req, res) => {
    res.sendFile(__dirname+"/globalVars.js")
})

app.get("/track.js", (req, res) => {
    res.sendFile(__dirname+"/public/javascript/track.js")
})

app.post('/submitlogin', (req, res) => {
    let username = req.body.username;
    let pswd = req.body.password;

    if (username in users) {
        // compare submitted password with stored hash
        bcrypt.compare(pswd, users[username].password, function(err, result) {
            if (result) {
                // passwords match
                res.redirect("/menu");
            } else {
                // passwords don't match or error occurred
                if (err) {
                    res.redirect("/login?error=2") //error occured
                } else {
                    res.redirect("/login?error=1"); //pwd dont match
                }
            }
        });
    } else {
        // username does not exist
        res.redirect("/login?error=1");
    }
});

app.post("/submitsignup", (req, res) => {
    let username = req.body.username;
    let pswd = req.body.password;

    if (!(username in users)) {
        // hash the password before saving it
        bcrypt.hash(pswd, saltRounds, function(err, hash) {
            if (err) {
                // Handle error
                res.redirect("/?error=1"); 
            } else {
                // save the user with the hashed password
                users[username] = {
                    "password": hash, // store the hash instead of the plain password
                    "friends": [],
                    "pbs": {
                        "track1":"--",
                        "track2":"--",
                        "track3":"--",
                        "track4":"--",
                        "track5":"--",
                        "track6":"--",
                        "track7":"--",
                        "track8":"--"
                    },
                    "keybinds": {
                        "forward": 38,
                        "backward": 40,
                        "left": 37,
                        "right": 39
                    }                };
                // rewrite file
                writeData(users);
                res.redirect("/menu");
            }
        });
    } else {
        // Handle case where username already exists
        res.redirect("/?error=1"); // Redirect back to signup or another appropriate response
    }
}); 

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});



// here beginnith websockets

socket.on('connection', (ws) => {
    ws.on('message', (message) => {
        // message should be a JSON that has the request type, eg new game, login, join, etc
        // json shall look as thus:
        /**
         * {
         *  "method": [method - join, create, chat, whisper, drive etc?]
         *  "id": [user id]
         * }
         */

        // unique ID generator, for createing game codes. modified from https://stackoverflow.com/posts/44996682/revisions
        function S4() {
            return ((((Math.random())*0x100000)|0).toString(16).substring(0))
        } 

        let msg = JSON.parse(message)
        if (msg.method === "chat") {
            let packet = {
                "method": "chat",
                "username": msg.username,
                "message": msg.message
            }
            socket.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(packet))
                }
            })
        } else if (msg.method === "create") {
            code = S4()
            codeCheck = false
            // make sure the code aint used yet
            while (!codeCheck) {
                if (gameCodes.includes(code)) {
                    code = S4()
                }
                if (!gameCodes.includes(code)) {
                    codeCheck = true
                    gameCodes.push(code)
                }
            }
            let packet = {
                "method": "create",
                "username": msg.username,
                "code": code,
                "track": msg.track
            }
            /*
            games object should be like
            {
                D0f2fF: {
                    track: track 1
                    users: [finn, lucas, everett] // if finn isnt in the room yet
                    host: finn
                }
            }
            */
            games[code] = {
                "track": msg.track.replace(/\s/g, ""), // clear spaces
                "users": [msg.username],
                "host": msg.username,
                "ingame": false //0 for lobby, 1 for in-game
            }
            socket.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(packet))
                }
            })
        } else if (msg.method === "join") {
            // do we have that code?
            if (games.hasOwnProperty(msg.code)) { // yes we do
                let canJoin = true

                if (!games[msg.code].users.includes(msg.username)) {
                    if (games[msg.code].users.length >= maxGameCapacity){ //too many players, cant join
                        canJoin = false
                        packet = {
                            method: "join",
                            username: msg.username,
                            track: "ERROR2",
                            limit: maxGameCapacity,
                            code: msg.code
                        }
                        socket.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(packet))
                            }
                        })
                    } else {
                        games[msg.code].users.push(msg.username)
                    }
                }
                if (canJoin){
                    packet = {
                        method: "join",
                        host: games[msg.code].host,
                        username: msg.username,
                        users: games[msg.code].users,
                        track: games[msg.code].track,
                        code: msg.code,
                        ingame: games[msg.code].ingame
                    }
                    socket.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(packet))
                        }
                    })
                }
            } else { // no we dont
                packet = {
                    method: "join",
                    username: msg.username,
                    track: "ERROR1",
                    code: msg.code
                }
                socket.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(packet))
                    }
                })
            }
        } else if (msg.method === "start-multiplayer"){ //this is when the host presses the start-game button
            // do we have that code?
            if (games.hasOwnProperty(msg.code)) { // yes we do
                if (games[msg.code].host === msg.username){ //make sure the host is starting the game
                    //"start" the game
                    games[msg.code].ingame = 1

                    packet = {
                        method: "start-multiplayer",
                        username: msg.username,
                        code: msg.code,
                        track: games[msg.code].track
                    }
                    socket.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(packet))
                        }
                    })
                } else {
                    packet = {
                        method: "start-multiplayer",
                        username: msg.username,
                        track: "ERROR"
                    }
                    socket.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(packet))
                        }
                    })
                }
            } else { // no we dont
                packet = {
                    method: "start-multiplayer",
                    username: msg.username,
                    track: "ERROR"
                }
                socket.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(packet))
                    }
                })
            }
        } else if (msg.method === "render") {
            // send to each user with the code the position of the player who just send their thingamabob.
            let packet = {
                method: "render",
                username: msg.username,
                code: msg.code,
                x: msg.x,
                y: msg.y,
                z: msg.z
            }
            socket.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(packet))
                }
            })
        } else if (msg.method === "user_write"){ //update le user data
            writeData(msg.data, msg.username, msg.info1, msg.info2)
        } else if (msg.method === "user_read"){ //return le user data
            let packet = readData(msg.username, msg.info1, msg.info2)
            packet["method"] = "user_read"

            socket.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(packet))
                }
            })
        }

    })
})


