import NidgetElement from "./NidgetElement.js";

class MultipleChoiceCompose extends NidgetElement {

    constructor() {
        super("multiple-choice-compose-template");
    }
}

window.customElements.define('multiple-choice-compose', MultipleChoiceCompose);
export default MultipleChoiceCompose;