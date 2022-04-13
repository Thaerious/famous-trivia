import NidgetElement from "@nidget/core";

class MenuItem extends NidgetElement {

    constructor() {
        super("menu-item-template");
    }
}

window.customElements.define('menu-item', MenuItem);
export default MenuItem;