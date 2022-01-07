// noinspection SpellCheckingInspection

import FileOps from "../modules/FileOps.js";
import Authenticate from "../modules/Authenticate.js";
import HostPortalView from "./HostPortalView.js";
import PortalController from "../modules/PortalController";
import connectWebsocket from "../modules/connectWebsocket.js";
import GameManagerService from "../modules/GameManagerService";
import constants from "../modules/constants.js";
import setupSizeListener from "../modules/SetupSizeListener";
import pageReloader from "../modules/pageReloader.js";  

let gameManagerService = new GameManagerService();
let fileOps = new FileOps();
let model = null;
let questionPane = null;
let editorPane = null;

window.onload = async () => {
    let start = new Date();
    const hostView = new HostPortalView();

    setupSizeListener();

    try{
        await pageReloader();
    } catch (err){
        console.log("page reloader unavailable");
    }

    try {
        await new Authenticate().loadClient();
        await fileOps.loadClient();
        await gameManagerService.connectHost();
        let ws = await connectWebsocket();
        new PortalController(ws, hostView);

        document.querySelector("menu-container").addEventListener("add-players", ()=>{
            ws.send(JSON.stringify({action : "join", data : {name : "Adam"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Bert"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Carol"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Dave"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Edith"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Fran"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Garth"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Herbert"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Ira"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Jill"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Keith"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Lisa"}}));
            ws.send(JSON.stringify({action : "join", data : {name : "Matt"}}));
        });

        document.querySelector("menu-container").addEventListener("next", ()=>{
            ws.send(JSON.stringify({action : "next_round"}));
        });

        document.querySelector("menu-container").addEventListener("prev", ()=>{
            ws.send(JSON.stringify({action : "prev_round"}));
        });

        document.querySelector("menu-container").addEventListener("terminate", ()=>{
            let token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
            gameManagerService.terminate(token);
            window.location = constants.locations.HOST;
        });

        document.querySelector("player-container").addEventListener("context-score", (event) =>{
            const score_dialog = document.querySelector("set-score-dialog");
            const player_card = event.detail["context_menu_item"].closestParent("player-card");
            
            score_dialog.name = player_card.name;
            score_dialog.score = player_card.score;
            score_dialog.show();
        });       

        document.querySelector("player-container").addEventListener("context-remove", (event) =>{
            console.log(event);
            const remove_dialog = document.querySelector("#confirm-remove");
            const player_card = event.detail["context_menu_item"].closestParent("player-card");

            remove_dialog.querySelector("#text").textContent = `Remove ${player_card.name}?`;
            remove_dialog.show();

            remove_dialog.addEventListener("dialog-accept", event => {
                ws.send(JSON.stringify({
                    action : "remove_player", 
                    data : {
                        name : player_card.name
                    }
                }));                
            });
        });            
        
        document.querySelector("set-score-dialog").addEventListener("update-score", (event) =>{
            console.log("update-score in host portal");
            console.log(event);
            ws.send(JSON.stringify({
                action : "set_score", 
                data : {
                    name : event.detail.name,
                    score : event.detail.score
                }
            }));
        });              

    } catch (err) {
        console.log(err);
    }

    let end = new Date();
    let time = end - start;
    console.log("Load Time " + time + " ms");
}

function showScoreDialog(element){
    console.log(element);
    const dialog = document.querySelector("set-score-dialog");
    dialog.show();
    dialog.querySelector("#value").content = "0"
}