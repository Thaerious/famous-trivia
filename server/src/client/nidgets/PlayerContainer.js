"use strict";

import NidgetElement from "./NidgetElement.js";

class PlayerContainer extends NidgetElement {
    constructor(templateId = "player-container-template") {
        super(templateId);
        this.extraPlayersHidden = true;
    }

    async ready(){
        await super.ready();

        document.body.addEventListener("click", event => {
                if (this.extraPlayersHidden) return;
                this.querySelector(".outer").classList.add("hide-extra");
                this.querySelector("#expand-button .text").innerHTML = "&#9654;";
                this.extraPlayersHidden = true;
            }
        );

        this.querySelector("#expand-button").addEventListener("click", event => {
            if (this.extraPlayersHidden){
                this.querySelector(".outer").classList.remove("hide-extra");
                this.querySelector("#expand-button .text").innerHTML = "&#9664;";
                this.extraPlayersHidden = false;
                event.stopPropagation();
            }
        });
    }

    /**
     * Set the player values to the array.
     * Each element in the array is an object with:
     *  - name : string, display name
     *  - score : number, point count
     *  - active : boolean, is actively playing
     *  - light_state : {highlight, dim, normal}
     * @param playerArray
     */
    setPlayers(playerArray) {
        const cards = this.querySelectorAll("player-card");

        for (let i = 0; i < playerArray.length; i++) {
            cards[i].player = playerArray[i];
            cards[i].show();
        }

        for (let i = playerArray.length; i < cards.length; i++) {
            cards[i].hide();
        }

        this.querySelector("#expand-button").visible = playerArray.length > 6;
    }

    get cards() {
        return this.querySelectorAll("player-card.visible");
    }
}

window.customElements.define('player-container', PlayerContainer);
export default PlayerContainer;