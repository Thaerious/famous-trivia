import NidgetElement from "../modules/NidgetElement.js";

class TextUpdate extends CustomEvent {
    constructor(text) {
        super('text-update',
            {detail: {text: text}}
        );
    }
}

class QuestionPane extends NidgetElement {
    constructor() {
        super("question-pane-template");
    }

    async ready() {
        await super.ready();
        this.addEventListener("click", () => this.querySelector(".text-contents").focus());

        this.querySelector("#text-contents").addEventListener("blur", async () => {
            let text = this.querySelector(".text-contents").text;
            this.dispatchEvent(new TextUpdate(text.trim()));
        });
    }

    clear() {
        this.querySelector(".text-contents").text = "";
    }

    setText(text) {
        this.querySelector(".text-contents").text = text;
    }
}

window.customElements.define('question-pane', QuestionPane);
export default QuestionPane;



