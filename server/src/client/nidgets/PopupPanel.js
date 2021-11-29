"use strict";

import NidgetElement from "./NidgetElement.js";

class PopupPanel extends NidgetElement {
    constructor(templateId = "popup-panel-template") {
        super(templateId);
    }

    async ready() {
        await super.ready();
        for (let i = 0; i < this.childElementCount; i++){
            const node = this.children[i];
            this.DOM["popupInner"].append(node.cloneNode(true))
        };
        this.innerHTML = "";

        this.DOM["popupCloseButton"].addEventListener("click", event => this.hide());
    }
}

window.customElements.define('popup-panel', PopupPanel);
export default PopupPanel;