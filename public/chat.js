function new_chat_message(message, chatlog){ //creates and returns a new chat element with proper attributes
    let username = "ecvil" //TODO: when merging make this refer to some session data

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

function chat_send(){
    let chatlog = document.getElementById("chat-log")

    //add new element
    let input = document.getElementById("chat-new")
    new_chat_message(String(input.value), chatlog)

    //remove content from input
    input.value = ""

    //if there's more than 8 messages, delete the earliest one
    if (chatlog.children.length > 8){
        chatlog.removeChild(chatlog.children.item(0))
        
    }
}

//resizing chat
let container = document.getElementById("chat-container")
let margin = 10 //amount of pixels away from border that mouse can click and resize
let chat_top = window.innerHeight - container.clientHeight
let chat_right = container.clientWidth

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

    chat_top = window.innerHeight - container.clientHeight
    chat_right = container.clientWidth

    if (!(start_mx < chat_right - margin || start_mx > chat_right + margin)){ //mouse x is close to border of chat
        activex = true
        start_w = container.clientWidth
    } else {
        activex = false
    }

    if (!(start_my < chat_top - margin || start_my > chat_top + margin)){ //mouse y is close to border of chat
        activey = true
        start_h = container.clientHeight
    } else {
        activey = false
    }

    console.log(activex, activey)
})

window.addEventListener("mouseup", function(e){
    activex = false
    activey = false
})

window.addEventListener("mousemove", function(e) {
    let new_mx = e.clientX
    let new_my = e.clientY

    let container = document.getElementById("chat-container")

    if (activex) {
        let distx = new_mx - start_mx //normal because left of page is zerio
        container.style.width = String(start_w + distx) + "px"
    }
    if (activey) {
        let disty = start_my - new_my // swapped because top of page is zero
        container.style.height = String(start_h + disty) + "px"
    }
})