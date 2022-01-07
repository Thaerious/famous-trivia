import NidgetElement from "../modules/NidgetElement.js";

class ModalAlert extends NidgetElement {

    constructor() {
        super("modal-alert-template");
    }

    async ready() {
        await super.ready();
    }

    show(message){
        super.show();
        this.DOM['content'].innerHTML = message;
    }

    onDrag(event){
        console.log(event);
    }

}

window.customElements.define('modal-alert', ModalAlert);
export default ModalAlert;