import NidgetElement from "../script/NidgetElement.js";

class ContextMenuItem extends NidgetElement {
}

class PlayerContextMenu extends NidgetElement {

    constructor() {
        super("player-context-menu-template");
    }

    async ready(){
        console.log("player context menu ready");
        for (let item of this.outerSelectorAll("context-menu-item")){
            console.log(item);
            item.detach();
            this.querySelector("#inner").append(item);
            item.addEventListener("click", (event)=>{
                this.dispatchEvent(new CustomEvent(item.getAttribute("event-name"), {bubbles: true, composed: true}));
            });
        }        
    }
}

window.customElements.define('context-menu-item', ContextMenuItem);
window.customElements.define('player-context-menu', PlayerContextMenu);
export default PlayerContextMenu;