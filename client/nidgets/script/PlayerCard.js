"use strict";

import NidgetElement from "./NidgetElement.js";
import "./PlayerCard.js";
import constants from "famous-trivia-game";

class PlayerCard extends NidgetElement {
    constructor(templateId = "player-card-template") {
        super(templateId);
    }

    async ready() {
        await super.ready();
    }

    /**
     * Player data object:
     *  - name : string, display name
     *  - score : number, point count
     *  - active : boolean, is actively playing
     *  - light_state : {highlight, dim, normal}
     * @param player data object
     */
    set player(player) {
        this.name = player.name;
        this.score = player.score;
        switch (player.light_state) {
            case constants.LIGHT_STATE.HIGHLIGHT:
                this.highlight = true;
                this.active = true;
                this.dim = false;
                break;
            case constants.LIGHT_STATE.NORMAL:
                this.highlight = false;
                this.active = false;
                this.dim = false;
                break;
            case constants.LIGHT_STATE.DIM:
                this.highlight = false;
                this.active = false;
                this.dim = true;
                break;
        }
    }

    set name(value) {
        this.querySelector("#name").innerHTML = value;
        this.setAttribute("data-name", value);
    }

    set score(value) {
        this.querySelector("#score").innerHTML = value;
        this.setAttribute("data-score", value);
    }

    get name() {
        return this.querySelector("#name").innerHTML;
    }

    get score() {
        return this.querySelector("#score").innerHTML;
    }

    set dim(value) {
        if (value) this.querySelector(".outer").classList.add("dim");
        else this.querySelector(".outer").classList.remove("dim");
    }

    set highlight(value) {
        if (value) this.querySelector(".outer").classList.add("highlight");
        else this.querySelector(".outer").classList.remove("highlight");
    }

    set active(value) {
        if (value) this.querySelector("#buzz-light").classList.add("active");
        else this.querySelector("#buzz-light").classList.remove("active");
    }

    hideClock() {
        this.DOM.clock.classList.add("hidden");
    }

    buzz() {
        this.querySelector("#buzz-light").classList.remove("sweep-right");
        this.querySelectorAll(".clock-tick").forEach(e => e.classList.remove("spent"));
        setImmediate(()=> {
            this.querySelector("#buzz-light").classList.add("sweep-right");
        });
    }

    clear() {
        this.querySelector("#buzz-light").classList.remove("sweep-right");
        this.querySelectorAll(".clock-tick").forEach(e => e.classList.remove("spent"));
    }

    set timer(percent) {
        this.setTimer(percent);
    }

    setTimer(percent) {
        if (percent <= 80) this.querySelector(".clock-tick[data-index='4']").classList.add("spent");
        if (percent <= 60) this.querySelector(".clock-tick[data-index='3']").classList.add("spent");
        if (percent <= 40) this.querySelector(".clock-tick[data-index='2']").classList.add("spent");
        if (percent <= 20) this.querySelector(".clock-tick[data-index='1']").classList.add("spent");
        if (percent <= 0) this.querySelector(".clock-tick[data-index='0']").classList.add("spent");
    }
}

window.customElements.define('player-card', PlayerCard);
export default PlayerCard;