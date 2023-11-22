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

// Serve the static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the login page at the root path ('/')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});
app.get("/menu", (req, res) => {
    res.sendFile(__dirname+"/public/menu.html")
})

app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname, '/public/game.html'));
})

app.get("/res/track.jpg", (req, res) => {
    res.sendFile(__dirname+"/public/res/track.jpg")
})

app.get("/globalVars.js", (req, res) => {
    res.sendFile(__dirname+"/globalVars.js")
})

// Create a route to handle the form submission
app.post('/submitlogin', (req, res) => {
    let username = req.body.username
    let pswd = req.body.password
    if (username in users && pswd === users[username].password) {
        res.redirect("/menu")
    } else {
        res.redirect("/") 
    }
});

app.post("/submitsignup", (req, res) => {
    let username = req.body.username
    let pswd = req.body.password
    if (username in users) {
        res.redirect("/")
    } else {
        users[username] = {"password": pswd, "friends": []}
        res.redirect("/menu") 
    }
})

// Start the Express server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

socket.on('connection', (ws) => {
    ws.on('message', (message) => {
        // message should be a JSON that has the request type, eg new game, login, join, etc
        // json shall look as thus:
        /**
         * {
         *  "method": [method - joinGame, createGame, login, chat, whisper, drive etc?]
         *  "id": [user id]
         * }
         */
        let msg = JSON.parse(message)
        console.log(msg)
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
        }

    })
})

// unique ID generator, for createing game codes. modified from https://stackoverflow.com/posts/44996682/revisions
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
} 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substring(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();