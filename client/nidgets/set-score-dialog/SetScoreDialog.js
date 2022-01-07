import NidgetElement from "../modules/NidgetElement.js";

class SetScoreDialog extends NidgetElement {

    constructor() {
        super("set-score-dialog-template");
    }

    set name(value){
        this.querySelector("#name").innerText = value;
    }

    set score(value){
        this.querySelector("#value").content = value;
    }

    async ready(){
        window.addEventListener("load", ()=>{
            this.querySelector("#accept").addEventListener("click", ()=>{
                this.hide();
                const score = parseInt(this.querySelector("#value").content);
                if (isNaN(score)) return;

                const options = {
                    composed: true,
                    bubbles: true,
                    detail : {
                        score : score,
                        name : this.querySelector("#name").innerText
                    }
                };
console.log(options);
                this.dispatchEvent(new CustomEvent("update-score", options));
            });
        });
    }
}

window.customElements.define('set-score-dialog', SetScoreDialog);
export default SetScoreDialog;