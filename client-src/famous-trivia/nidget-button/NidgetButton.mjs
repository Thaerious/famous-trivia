import NidgetElement from "@nidget/core";

class NidgetButton extends NidgetElement {
    constructor() {
        super("nidget-button-template");
        console.log("nidget-button");
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

    set disabled(value) {
        if (value) this.classList.add("disabled");
        else this.classList.remove("disabled");
    }

    get disabled() {
        return this.classList.contains("disabled");
    }
}

window.customElements.define('nidget-button', NidgetButton);
export default NidgetButton;