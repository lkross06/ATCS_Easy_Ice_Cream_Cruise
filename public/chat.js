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