// the local user's username
let username = sessionStorage.getItem("username") 

// html element 'chat-log'
let chatlog = document.getElementById("chat-log")

function new_chat_message(message, chatlog, username){ //creates and returns a new chat element with proper attributes
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
// TODO: hardcoded url really sucks
let ws = new WebSocket("ws://localhost:8008")

function chat_send(){

    //add new element
    let input = document.getElementById("chat-new")    
    // websocket stuff - send the message to server
    let packet = {
        "method": "chat",
        "username": username,
        "message": String(input.value)
    }

    ws.send(JSON.stringify(packet))

    //remove content from input
    input.value = ""

    //if there's more than 8 messages, delete the earliest one
    if (chatlog.children.length > 8){
        chatlog.removeChild(chatlog.children.item(0))
    }
}

// websocket stuff for when the client recieves a message from the server
ws.onmessage = message => {
    let res = JSON.parse(message.data)

    if (res.method = "chat") {
        let usr = res.username
        let msg = res.message
        new_chat_message(msg, chatlog, usr)
    }
}