import NidgetElement from "../modules/NidgetElement.js";
import CheckBox from "../check-box/CheckBox";

class NidgetRadioGroup extends NidgetElement {

    getSelectedElement() {
        const q = `[${NidgetRadioButton.SELECTED_ATTRIBUTE}="true"]`;
        return this.querySelector(q);
    }

    get selected() {
        const element = this.getSelectedElement();
        if (!element) return "";
        return element.id;
    }

    set selected(id) {
        const q = `#${id}`;
        const element = this.querySelector(q);
        if (!element) return;
        if (element.disabled) return;
        if (this.selected === id) return;

        const detail = {
            "id": id,
            "element": element,
            "prev-id": this.selected,
            "prev-element": this.getSelectedElement()
        }

        if (this.getSelectedElement()) {
            this.getSelectedElement().selected = false;
        }
        element.selected = true;

        this.dispatchEvent(new CustomEvent("selection-changed", {detail : detail}));
    }

    async ready() {
        await super.ready();
        this.default = this.selected;
    }

    reset() {
        this.selected = this.default;
    }
}

class NidgetRadioButton extends NidgetElement {
    constructor() {
        super("nidget-radio-button-template");
    }

    async ready() {
        await super.ready();
        this.addEventListener("click", ()=> {
            this.closest("nidget-radio-group").selected = this.id;
        });
    }

    set selected(value) {
        this.setAttribute(NidgetRadioButton.SELECTED_ATTRIBUTE, value);
    }

    get selected() {
        return this.getAttribute(NidgetRadioButton.SELECTED_ATTRIBUTE) === "true";
    }
}

NidgetRadioButton.SELECTED_ATTRIBUTE = "selected";
window.customElements.define('nidget-radio-button', NidgetRadioButton);
window.customElements.define('nidget-radio-group', NidgetRadioGroup);
export default CheckBox;