import {domainName} from "../globalVars.js"

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
let ws = new WebSocket("ws://"+domainName+":8008")

document.addEventListener("keypress", function(event) { //on enter key press
    if (event.key == "Enter") {
        chat_send()
    }
})

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

//resizing chat
let container = document.getElementById("chat-container")
let margin = 10 //amount of pixels away from border that mouse can click and resize
let chat_top = window.innerHeight - container.clientHeight
let chat_right = container.clientWidth

function in_chat_right_range(mousex){
    return !(mousex < chat_right - margin || mousex > chat_right + margin)
}

function in_chat_top_range(mousey){
    return !(mousey < chat_top - margin || mousey > chat_top + margin)
}

let activex = false
let activey = false

let start_mx = 0
let start_my = 0

let start_w = container.clientWidth
let start_h = container.clientHeight

window.addEventListener("mousedown", function(e) {
    //update these 4 because they change every time the mouse is moved / chat is resized
    start_mx = e.clientX
    start_my = e.clientY

    start_w = container.clientWidth
    start_h = container.clientHeight

    if (in_chat_right_range(start_mx)){ //mouse x is close to border of chat
        activex = true
    } else {
        activex = false
    }

    if (in_chat_top_range(start_my)){ //mouse y is close to border of chat
        activey = true
    } else {
        activey = false
    }
})

window.addEventListener("mouseup", function(e){
    activex = false
    activey = false

    chat_top = window.innerHeight - container.clientHeight
    chat_right = container.clientWidth
})

window.addEventListener("mousemove", function(e) {
    let new_mx = e.clientX
    let new_my = e.clientY

    let container = document.getElementById("chat-container")

    //update cursor
    if (in_chat_right_range(new_mx) && in_chat_top_range(new_my)){
        document.body.style.cursor = "nesw-resize"
    } else if (in_chat_right_range(new_mx)){
        document.body.style.cursor = "ew-resize"
    } else if (in_chat_top_range(new_my)){
        document.body.style.cursor = "ns-resize"
    } else if (!(activex || activey)) {
        document.body.style.cursor = "default"
    }

    if (activex && activey) {
        let distx = new_mx - start_mx //see comments below
        container.style.width = String(start_w + distx) + "px"
        let disty = start_my - new_my 
        container.style.height = String(start_h + disty) + "px"

        document.body.style.cursor = "nesw-resize" //prevent other cursor
    } else if (activex) {
        let distx = new_mx - start_mx //normal because left of page is zero
        container.style.width = String(start_w + distx) + "px"

        document.body.style.cursor = "ew-resize" //prevent other cursor
    } else if (activey) {
        let disty = start_my - new_my // swapped because top of page is zero
        container.style.height = String(start_h + disty) + "px"

        document.body.style.cursor = "ns-resize" //prevent other cursor
    }
})