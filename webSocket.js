let express = require('express');
let bodyParser = require('body-parser')

let app = express();
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

// setting up the WebSocket!
const WebSocket = require('ws')
const socket = new WebSocket.Server({ port: 8008 })

socket.on('connection', ws => {
    ws.on('message', data => {
        // parsedData is the parsed version of the string sent by a client
        let parsedData = JSON.parse(data)

    })
})