import NidgetElement from "../modules/NidgetElement.js";

class NidgetButton extends  NidgetElement{
    constructor() {
        super("nidget-button-template");
    }

    async ready(){
       await super.ready();
       this.DOM.text.innerHTML = this.innerHTML;
       this.innerHTML = "";
    }

    disable(){
        this.classList.add("disabled");
    }

    enable(){
        this.classList.remove("disabled");
    }

    get disabled() {
        return this.classList.contains("disabled");
    }
}

window.customElements.define('nidget-button', NidgetButton);
export default NidgetButton;