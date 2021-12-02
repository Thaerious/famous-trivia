import GameManagerService from "./modules/GameManagerService.js";

let gameManagerService = new GameManagerService();

window.addEventListener("load", async(event)=>{
    /* attempt to join game, if already joined, forward to the game page */
    const gameHashResp = await gameManagerService.getGameHash();
    if (gameHashResp.result === "success"){
        window.location = `contestant_portal.ejs`;
    }

    document.querySelector("#name").addEventListener("text-enter", e=>submit());
    document.querySelector("#join").addEventListener("click", e=>submit());
    document.querySelector("#join").addEventListener("keypress", e=>submit());
});

async function submit(){
    const name =  document.querySelector("#name").content;
    const response = await gameManagerService.joinGame(window.parameters.hash, name);

    if (response.result === "rejected"){
        document.querySelector("#alert").show(response.reason);
    }
    else if (response.result === "success"){
        window.location = `contestant_portal.ejs`;
    }
}