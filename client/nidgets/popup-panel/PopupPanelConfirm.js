"use strict";

import PopupPanel from "./PopupPanel.js";

class PopupPanelConfirm extends PopupPanel {
    constructor(templateId = "popup-panel-confirm-template") {
        super(templateId);
    }

    async ready() {
        await super.ready();
        this.querySelector("#popup-accept-button").addEventListener("click", event => {
            this.dispatchEvent("dialog-accept");
            this.hide();
        }); 
    }
}

window.customElements.define("popup-panel-confirm", PopupPanelConfirm);
export default PopupPanel;
