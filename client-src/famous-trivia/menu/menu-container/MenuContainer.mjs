import NidgetElement from "@nidget/core";

class MenuContainer extends NidgetElement {
    constructor(props) {
        super("menu-container-template");
    }

    async ready(){
        await super.ready();
        window.addEventListener("load", () => this.load());
    }

    async load() {
        this.internalize("menu-item");
        this.querySelector("#menu-icon").setAttribute("src",  this.getAttribute("image-src"));

        for (let item of this.querySelectorAll("menu-item")){
            item.addEventListener("click", (event)=>{
                this.dispatchEvent(new CustomEvent(item.getAttribute("event-name"), {bubbles: true, composed: true}));
            });
        }

        this.positionMenu();

        this.menuButton.addEventListener("click", ()=>this.toggleMenu());
        this.menuArea.addEventListener("mouseleave", ()=> this.mouseLeave());
        this.menuButton.addEventListener("mouseleave", ()=> this.mouseLeave());
        this.menuArea.addEventListener("mouseenter", ()=> this.mouseEnter());
        this.menuButton.addEventListener("mouseenter", ()=> this.mouseEnter());
    }

    init(menuSelector) {
        document.querySelectorAll("[data-autoclose='true']").forEach(ele => {
            ele.addEventListener("click", () => this.close());
        });

        document.querySelectorAll(".sub-menu").forEach(ele => {
            ele.querySelector(".menu-label").addEventListener("click", () => {
                this.toggleMenu(ele);
            });
        });

        return this;
    }

    close() {
        this.menuArea.classList.add("hidden");

        document.querySelectorAll(".sub-menu > .menu-area").forEach(ele => {
            ele.classList.add("hidden");
        });
    }

    open() {
        this.menuArea.classList.remove("hidden");
        this.positionMenu();
    }

    mouseLeave() {
        if (this.timeout) return;
        this.timeout = setTimeout(() => {
            this.close();
            this.timeout = null;
        }, 500);
    }

    mouseEnter() {
        if (!this.timeout) return;
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    showMenu() {
        this.menuArea.classList.remove("hidden");
        this.positionMenu();
    }

    hideMenu() {
        this.menuArea.classList.add("hidden");
    }

    isMenuHidden() {
        return this.menuArea.classList.contains("hidden");
    }

    toggleMenu() {
        if (this.isMenuHidden()) this.showMenu();
        else this.hideMenu();
    }

    positionMenu() {
        const left = this.menuButton.getBoundingClientRect().left;
        const bWidth = this.menuButton.getBoundingClientRect().width;
        const mWidth = this.menuArea.getBoundingClientRect().width;

        if (left + bWidth + mWidth + 2 > window.innerWidth) {
            this.setMenuLeft();
        } else {
            this.setMenuRight();
        }
    }

    setMenuLeft() {
        const left = this.menuButton.offsetLeft;
        const width = this.menuArea.offsetWidth;
        this.menuArea.style.left = left - width - 2 + "px";
    }

    setMenuRight() {
        const left = this.menuButton.offsetLeft;
        const width = this.menuButton.offsetWidth;
        this.menuArea.style.left = left + width + 2 + "px";
    }

    get menuButton() {
        return this.querySelector("#menu-icon");
    }

    get menuArea() {
        return this.querySelector("#outer");
    }
}

window.customElements.define("menu-container", MenuContainer);
export default MenuContainer;