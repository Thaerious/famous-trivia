"use strict";

/** View-Controller for the HTML game board element
    This is the classical "Jeopardy" type board
    This is model agnostic, see EditorPane.js for model methods
    generates the following events:
        cell-select (row, col): when a user clicks a cell
        header-update (value, col, fontsize) : when the header text changes (and blurs)
 **/

import NidgetElement from "./NidgetElement.js";

class CellSelectEvent extends CustomEvent{
    constructor(row, col) {
        row = parseInt(row);
        col = parseInt(col);

        super('cell-select',
              {detail : {row : row, col : col }}
        );
    }
}

class HeaderUpdateEvent extends  CustomEvent{
    constructor(col, value, fontSize) {
        col = parseInt(col);

        super('header-update',
            {detail : {value : value, col : col, fontSize : fontSize}}
        );
    }
}

class GameBoard extends NidgetElement {
    constructor() {
        super("game-board-template");
    }

    async ready(){
        await super.ready();

        for (let element of this.querySelectorAll(".text-buffer")){
            const value = element.querySelector(".value");
            element.addEventListener("click", e =>{
                if (value.innerHTML === "") value.innerHTML = " "; // makes the cursor show up when focused
                value.focus();
            });
        }

        for (let col = 0; col < 6; col++) {
            this.getHeader(col).addEventListener("input", (event)=>{
                event.target.fitText.notify();
            });

            this.getHeader(col).addEventListener("blur", (event)=>{
                console.log(event.target);
                window.x = event.target;
                event.target.innerHTML = event.target.text.trim();
                event.target.fitText.notify(fontSize=>{
                    this.dispatchEvent(new HeaderUpdateEvent(col, this.getHeader(col).text, fontSize));
                });
            });

            for (let row = 0; row < 5; row++) {
                this.getCell(row, col).addEventListener("click", () => {
                    this.dispatchEvent(new CellSelectEvent(row, col));
                });
            }
        }
    }

    /**
     * Set the category text.
     * @param index The column to set
     * @param value The text to set it to.
     * @param fontSize
     * @param lock turn off content-editable, default false (on).
     */
    setHeader(index, value, fontSize, lock = false){
        const element = this.getHeader(index);
        element.text = value;
        element.style.fontSize = fontSize;

        if (lock){
            element.setAttribute("contentEditable", "false");
        }
    }

    /**
     * Retrieve the header html element
     * @param index
     * @param value
     */
    getHeader(index){
        if (typeof index !== "number" || index < 0 || index > 6) throw new Error("Invalid index: " + index);
        let selector = `[data-row='h'][data-col='${index}'] .value`;
        return this.querySelector(selector);
    }

    /**
     * Set the value of a non-category cell.
     * @param row
     * @param col
     * @param value
     */
    setCell(row, col, value = ""){
        this.getCell(row, col).textContent = value;
    }

    getCell(row, col){
        let selector = `[data-row="${row}"][data-col="${col}"] .value`;
        return this.querySelector(selector);
    }

    setComplete(row, col, value){
        if (typeof row !== "number" || row < 0 || row > 6) throw new Error("Invalid row: " + row);
        if (typeof col !== "number" || col < 0 || col > 5) throw new Error("Invalid col: " + col);
        this.getCell(row, col).setAttribute("data-complete", value);
    }
}

window.customElements.define('game-board', GameBoard);
export default GameBoard;