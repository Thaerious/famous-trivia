import NidgetElement from "./NidgetElement.js";
require("../check-box/CheckBox.js");

class ValueUpdate extends CustomEvent {
    constructor(index, value, checked) {
        if (typeof index !== "number") index = parseInt(index);
        if (typeof value !== "number") index = parseInt(value);
        if (typeof checked !== "boolean") checked = (checked === "true");

        super('value-update',
            {detail: {index: index, value: value, checked: checked}}
        );
    }
}

class MultipleChoicePresent extends NidgetElement {
    constructor() {
        super("multiple-choice-present-template");
        this.timeouts = [];
    }

    setTimeout(index, value){
        if (this.timeouts[index]) clearTimeout(this.timeouts[index]);
        this.timeouts[index] = setTimeout(()=>{
            const event = new ValueUpdate(index, value, true);
            this.dispatchEvent(event);
            this.timeouts[index] = undefined;
        }, 300);
    }

    async ready() {
        await super.ready();

        for (const element of this.querySelectorAll("check-box")){
            element.addEventListener("value-update", event => {
                const index = element.parentElement.getAttribute("data-index");
                const checked = (event.detail.value === true);
                const value = element.parentElement.querySelector(".wager").content;
                element.parentElement.querySelector(".wager").disabled = !checked;
                this.dispatchEvent(new ValueUpdate(index, parseInt(value), checked));
            });
        }

        for (const element of this.querySelectorAll(".wager")){
            element.addEventListener("click", event=>{
                element.content = "";
            });
            element.addEventListener("text-update", event=>{
                const index = element.parentElement.getAttribute("data-index");
                const value = event.detail.content;
                this.dispatchEvent(new ValueUpdate(index, parseInt(value), true));
            });
        }
    }

    setMode(mode) {
        switch (mode) {
            case "show":
                this.classList.add("show-mode");
                break;
            case "data-enter":
            default:
                this.classList.remove("show-mode");
                break;
        }
    }

    setAnswerText(index, text) {
        this.querySelector(`.row[data-index="${index}"] .answer`).text = text;
    }

    setChecked(index, value) {
        this.querySelector(`.row[data-index="${index}"] check-box`).checked = value;
    }
}

window.customElements.define('multiple-choice-present', MultipleChoicePresent);
export default MultipleChoicePresent;