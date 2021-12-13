"use strict";
import NidgetElement from "./NidgetElement.js";

/**
 * Set the font-size as a multiple of the css variable --fit-text-unit.
 * Style example: calc(45 * var(--fit-text-unit))
 */
class FitText { 
    constructor(nidget){
        this.nidget = nidget;
        this.parseArguments();
        this.coefficient = this.extractUnits();
        this.lastCoefficient = 0;

        this.last = {
            hDiff: this.nidget.parentElement.offsetHeight - this.nidget.scrollHeight,
            wDiff: this.nidget.parentElement.offsetWidth - this.nidget.scrollWidth
        };
    }    

    extractUnits(){
        const fontSize = this.nidget.style.fontSize;
        if (fontSize === "") return 1;
        if (!fontSize.endsWith(" * var(--fit-text-unit))")) return 1;
        if (!fontSize.startsWith("calc(")) return 1;
        const value = parseInt(fontSize.substr("calc(".length));
        if (!value || value < 1) return 1;
        return value;
    }

    notify(cb){
        this.direction = 0;
        setImmediate(()=>this.onResize(cb));
    }

    /**
     * Retrieve the settings from css
     */
    parseArguments(){
        let args = getComputedStyle(this.nidget).getPropertyValue("--nidget-fit-text");

        if (!args || args === false){
            this.hValue = 1;
            this.wValue = 1;
            return;
        }

        if (typeof(args) == "string"){
            if (args.search("height") !== -1) this.hValue = 1;
            if (args.search("width") !== -1) this.wValue = 1;
        }
    }

    /**
     * Fit the text element to it's parent element.
     * @param hValue true, fit the height
     * @param wValue true, fit the width
     */
    onResize(cb){
        delete this.timeout;
        cb = cb ?? function(){};

        if (this.nidget.textContent === "") return;
        if (this.nidget.parentElement.offsetHeight === 0) return;
        if (this.nidget.parentElement.offsetWidth === 0) return;
        if (this.nidget.style.display === "none") return;
        if (!this.hValue && !this.wValue) return;

        // hDiff growth direction due to height
        // wDiff growth direction due to width
        let hDiff = this.nidget.parentElement.offsetHeight - this.nidget.scrollHeight;
        let wDiff = this.nidget.parentElement.offsetWidth - this.nidget.scrollWidth;

        if (this.last.hDiff === hDiff && this.last.wDiff === wDiff) {
            cb(this.nidget.style.fontSize);
            return;
        }

        if (!this.hValue) hDiff = 0;
        if (!this.wValue) wDiff = 0;

        let dir = Math.sign(hDiff | wDiff); // will prefer to shrink
        const newCoefficient = this.coefficient + dir;

        const fontSize = `calc(${newCoefficient} * var(--fit-text-unit))`;
        if (newCoefficient !== this.coefficient && newCoefficient !== this.lastCoefficient) {
            this.nidget.style.opacity = 0.0;
            this.nidget.style.fontSize = fontSize;
            this.lastCoefficient = this.coefficient;
            this.coefficient = newCoefficient;
            this.timeout = setImmediate(()=>this.onResize(cb));
        } else {
            this.nidget.style.opacity = 1.0;
            this.lastCoefficient = 0;
            this.last = {hDiff: hDiff, wDiff: wDiff};
            cb(fontSize);
        }
    }
}

/**
 * A nidget element for displaying text.
 * put '--nidget-fit-text: 1.0;' into css for this element to enable scaling.
 * see: NidgetStyle.js
 */
class NidgetText extends NidgetElement {

    constructor() {
        super();
    }

    remove(){
        super.remove();
    }

    get fitText(){
        if (!this._fitText) this._fitText = new FitText(this);
        return this._fitText;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    set text(value){
        this.innerText = value;
    }

    get text(){
        return this.innerText;
    }
}
;

if (!window.customElements.get('nidget-text')) {
    window.customElements.define('nidget-text', NidgetText);
}
export default NidgetText;