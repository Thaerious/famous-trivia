"use strict";

import NidgetElement from "../modules/NidgetElement.js";

class PopupPanel extends NidgetElement {
    constructor(templateId = "popup-panel-template") {
        super(templateId);
    }

    async ready() {
        await super.ready();

        window.addEventListener("load", () => {
            this.setAttribute("draggable", "true");
            document.addEventListener("drag", event => {
                event.preventDefault();
                if (event.target !== this) return;
                const diffX = this.start.offsetX - event.offsetX;
                const diffY = this.start.offsetY - event.offsetY;

                if (Math.abs(diffX) < 20 || Math.abs(diffY) < 20) {
                    const newX = this.offsetLeft - diffX;
                    const newY = this.offsetTop - diffY;
                    this.style.left = newX + "px";
                    this.style.top = newY + "px";
                }
            });

            this.addEventListener("dragstart", event => {
                this.start = event;
            });
        });

        for (let i = 0; i < this.childElementCount; i++) {
            const node = this.children[i];
            this.DOM["popupInner"].append(node.cloneNode(true));
        }
        this.innerHTML = "";

        this.querySelector("#popup-close-button").addEventListener("click", event => {
            this.dispatchEvent("dialog-close", {composed: true,bubbles: true});
            this.hide();
        });
    }

    show(message){        
        this.querySelector("#popup-inner").innerText = message;
        super.show();
    }
}

window.customElements.define("popup-panel", PopupPanel);
export default PopupPanel;
