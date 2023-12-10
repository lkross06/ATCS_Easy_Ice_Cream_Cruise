import {domainName} from "../globalVars.js"

// the local user's username
let username = sessionStorage.getItem("username") 

// html element 'chat-log'
let chatlog = document.getElementById("chat-log")
let chats = []

function new_chat_message(message, username){ //creates and returns a new chat element with proper attributes
    if (message == ""){
        return
    }

    let p = document.createElement("p")
    p.setAttribute("class", "chat-message")
    
    let spanuser = document.createElement("span")
    spanuser.setAttribute("class", "username")
    spanuser.innerText = username

    let spancontent = document.createElement("span")
    spancontent.setAttribute("class", "chat-message-content")
    spancontent.innerText = " " + message

    p.appendChild(spanuser)
    p.appendChild(spancontent)

    chatlog.appendChild(p)
}

document.getElementById("chat-send").addEventListener("click", chat_send)
let ws = new WebSocket("ws://"+domainName+":8008")

document.addEventListener("keypress", function(event) { //on enter key press
    if (event.key == "Enter") {
        chat_send()
    }
})

function cleanChatlog(){ //removes excess messages if there are too many / too little
    function getChatlogHeight(){
        let rtn = 0
        for (let chat of chatlog.children){
            rtn += chat.clientHeight
        }
        return rtn
    }

    while (getChatlogHeight() >= chatlog.clientHeight) {
        chatlog.removeChild(chatlog.firstChild)
    }
}

window.addEventListener("resize", function(event){
    cleanChatlog()
})

function chat_send(){
    function validInput(input){
        let rtn = 0
        for (let i of [...new Set(input)]){
            if (i != " ") rtn += 1
        }
        return rtn > 0
    }

    //add new element
    let input = document.getElementById("chat-new")    

    if (validInput(input.value)){
        // websocket stuff - send the message to server
        let packet = {
            "method": "chat",
            "username": username,
            "message": String(input.value)
        }

        chats.push(packet)

        ws.send(JSON.stringify(packet))

        //remove content from input
    }
    
    input.value = ""
}

function createGame() {
    let packet = {
        method: "create",
        username: sessionStorage.getItem("username"),
        track: document.getElementById("tracks").value
    }            
    ws.send(JSON.stringify(packet))
}
let createButton = document.getElementById("createGame")
createButton.addEventListener("click", createGame)

function joinGame() {
    let packet = {
        method: "join",
        username: sessionStorage.getItem("username"),
        code: document.getElementById("multiplayer-join-code").value
    }
    ws.send(JSON.stringify(packet))
}
let joinButton = document.getElementById("joinGame")
joinButton.addEventListener("click", joinGame)
// websocket stuff for when the client recieves a message from the server
ws.onmessage = message => {
    let res = JSON.parse(message.data)
    if (res.method === "chat") {
        let usr = res.username
        let msg = res.message
        new_chat_message(msg, usr)
        cleanChatlog() //remove chats if necessary
    } else if (res.method === "create") {
        // get that code brother
        if (res.username === sessionStorage.getItem("username")) {
            // dingdingding we gotchu fam
            let codeDiv = document.getElementById("gameCode")
            codeDiv.style.display = "block"
            codeDiv.innerText = res.code
        }
    } else if (res.method === "join") {
        // confirm that user has actually put in a good code, 
        // then redir. (look at that enjambment!)
        if (res.username === sessionStorage.getItem("username")) {
            // dingdingding we gotchu fam
            if (res.track === "ERROR") {
                console.log("WRONG CODE BUDDY TRY AGAIN")
                // TODO: add some HTML error thingy here
            } else {
                sessionStorage.setItem("code", res.code)
                location.replace(res.track)
            }
        }
    }
}