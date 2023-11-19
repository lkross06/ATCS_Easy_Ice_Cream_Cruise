window.onload = function(e){
    document.getElementById("modalbutton1").addEventListener("click", function(e){
        let modal = document.getElementById("modal1")
        modal.style.display = "block";
    })

    window.addEventListener("click", function(e){
        let modal = document.getElementById("modal1")
        if (e.target == modal) {
          modal.style.display = "none";
        }
    })
}