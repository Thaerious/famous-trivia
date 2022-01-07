import Authenticate from '../modules/Authenticate.js';
import GameManagerService from "../modules/GameManagerService.js"
import constants from '../modules/constants.js';

const gameManagerService = new GameManagerService();

window.addEventListener("load", async ()=>{
    console.log("here");
    await new Authenticate().loadClient();
    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

    const response = await gameManagerService.getHostedHash(token);

    if (response['result'] !== "success"){
        window.location = constants.locations.HOST;
    }

    const len = location.href.lastIndexOf("/");
    const url = `${location.href.substr(0, len)}/${constants.locations.CONTESTANT_JOIN}?hash=${response['game-hash']}`;
    document.querySelector("#contestant_link").innerText = url;

    document.querySelector("#host").addEventListener("click", ()=>{
        window.open(constants.locations.HOST_PORTAL, '_blank').focus();
    });

    document.querySelector("#contestant").addEventListener("click", ()=>{
        copyLink();
    });

    document.querySelector("#terminate").addEventListener("click", async ()=>{
        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
            await gameManagerService.terminate(token);
            window.location = "host.html";
    });

    document.querySelector("#busy-box").classList.add("hidden")
});

function copyLink() {
    let range = document.createRange();
    range.selectNode(document.getElementById("contestant_link"));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    window.range = range;
    document.execCommand("copy");
    document.querySelector("#message").classList.remove("flash");
    console.log("LINK COPIED");
    setTimeout(()=>document.querySelector("#message").classList.add("flash"), 0);
}