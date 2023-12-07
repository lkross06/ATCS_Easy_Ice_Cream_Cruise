const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
// setting up the WebSocket!
const WebSocket = require('ws')
const socket = new WebSocket.Server({ port: 8008 })

// object containing all the users
let users = {}
// object containing all the running games 
let games = {}
// object containing all he chat messages. max len of like 100 lets say. newest at the end. 
let chats = {}
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
    res.sendFile(path.join(__dirname, '/public/track1.html'));
});

app.get("/res/track.jpg", (req, res) => {
    res.sendFile(__dirname+"/public/res/track.jpg")
})

app.get("/globalVars.js", (req, res) => {
    res.sendFile(__dirname+"/globalVars.js")
})

app.get("/track.js", (req, res) => {
    res.sendFile(__dirname+"/public/javascript/track.js")
})

// all post paths. mainly using websockets so not many. 
app.post('/submitlogin', (req, res) => {
    let username = req.body.username
    let pswd = req.body.password
    if (username in users && pswd === users[username].password) {
        res.redirect("/menu")
    } else {
        res.redirect("/login") 
    }
});

app.post("/submitsignup", (req, res) => {
    let username = req.body.username
    let pswd = req.body.password
    if (!(username in users)) {
        users[username] = {"password": pswd, "friends": []} 
    }
    res.redirect("/menu")
})

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
                    users: [lucas, everett] // if finn isnt in the room yet
                    host: finn
                }
            }
            */
            games[code] = {
                "track": msg.track.replace(/\s/g, ""), // clear spaces
                "users": [],
                "host": msg.username
            }
            socket.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(packet))
                }
            })
        } else if (msg.method === "join") {
            // do we have that code?
            if (games.hasOwnProperty(msg.code)) { // yes we do
                if (!games[msg.code].users.includes(msg.username)) {
                    games[msg.code].users.push(msg.username)
                }
                packet = {
                    method: "join",
                    username: msg.username,
                    track: games[msg.code].track,
                    code: msg.code
                }
                socket.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(packet))
                    }
                })
            } else { // no we dont
                packet = {
                    method: "join",
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
        }

    })
})


