import NidgetElement from "../modules/NidgetElement.js";

class ContextEvent extends CustomEvent {
    constructor(context_menu_item) {
        const event_name = context_menu_item.getAttribute(ContextEvent.EVENT_NAME_ATTR);
        const options = {
            composed: true,
            bubbles: true,
            detail : {
                context_menu_item : context_menu_item
            }
        };

        super(event_name, options);
    }
}

class ContextVisibleEvent extends CustomEvent {
    constructor(detail = {}) {
        const options = {
            composed: true,
            bubbles: true,
            detail: detail,
        };

        super("context-visible-event", options);
    }
}

class ContextMenuItem extends NidgetElement {
    constructor() {
        super();
    }

    setup() {
        this.addEventListener("click", event => {
            this.dispatchEvent(new ContextEvent(this));
        });
    }
}

class ContextMenu extends NidgetElement {
    constructor() {
        super("context-menu-template");
    }

    async ready() {
            window.addEventListener("load", () => {
            const items = this.internalize("context-menu-item");
            for (const item of items) item.setup();

                this.parentElement.addEventListener("contextmenu", event => {
                    this.visible = true;
                    event.preventDefault();
                    this.style.left = event.offsetX + "px";
                    this.style.top = event.offsetY + "px";
                    document.addEventListener("click", event => (this.visible = false), { once: true });
                    this.dispatchEvent(new ContextVisibleEvent({ pointer_event: event }));
                });
            });

            this.visible = false;
    }
}

ContextEvent.EVENT_NAME_ATTR = "event-name";
window.customElements.define("context-menu-item", ContextMenuItem);
window.customElements.define("context-menu", ContextMenu);
export default { ContextMenu, ContextEvent, ContextVisibleEvent };
// export default ContextMenu;
