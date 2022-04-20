import emptyCategory from "../json_schema/empty_categorical.js";
import emptyMC from "../json_schema/empty_mulitple_choice.js";
import SCHEMA_CONSTANTS from "../json_schema/schema_constants.js";
import constants from "../modules/constants.js";

const DOM = {/* see EditorPane.constructor */};

class JPBoardCtrl {
    constructor(saveCB) {
        this.saveCB = saveCB;
        this.jpQuestionControl = new JPQuestionCtrl(this);
        this.jpAnswerControl = new JPAnswerCtrl(this);
        this.gameBoard = document.querySelector("#jp .game-board");
        this.setupListeners();
    }

    setupListeners() {
        document.querySelector("#jp .show-board").addEventListener("click", event=> {
            this.show(this.model);
        });

        // game-board select cell
        this.gameBoard.addEventListener("cell-select", event => {
            let row = event.detail.row;
            let col = event.detail.col;

            window.parameters.subtype = "question";
            window.parameters.row = row;
            window.parameters.col = col;
            pushParameters();

            this.saveCB();
            this.jpQuestionControl.show(this.model.column[col].cell[row]);
        });
    }

    setModel(model) {
        this.model = model ?? this.model;
    }

    show(model) {
        console.log(model);
        this.model = model ?? this.model;

        document.querySelector("#jp").show();
        document.querySelector("#jp .game-board").show();
        document.querySelector("#jp .answer-pane").hide();
        document.querySelector("#jp .question-pane").hide();
        document.querySelector("#jp .button-container").hide();
        document.querySelector("#jp .show-question").enable();
        document.querySelector("#jp .show-answer").enable();
        document.querySelector("#jp .show-board").disable();

        document.querySelector("#menu").querySelector("#menu-decrease-value").show();
        document.querySelector("#menu").querySelector("#menu-increase-value").show();

        window.parameters.type = "jeopardy";
        delete window.parameters.subtype;
        pushParameters();

        for (let col = 0; col < 6; col++) {
            let column = this.model.column[col];
            this.gameBoard.setHeader(col, column.category, column.fontSize);

            for (let row = 0; row < 5; row++) {
                this.gameBoard.setCell(row, col, column.cell[row].value);
                if (column.cell[row].q === "") {
                    this.gameBoard.setComplete(row, col, "false");
                }
                else if (column.cell[row].a === "") {
                    this.gameBoard.setComplete(row, col, "partial");
                }
                else {
                    this.gameBoard.setComplete(row, col, "true");
                }
            }
        }
    }
}

class JPQuestionCtrl {
    constructor(boardCtrl) {
        this.boardCtrl = boardCtrl;
        this.setupListeners();
    }

    setupListeners() {
        document.querySelector("#jp .show-answer").addEventListener("click", event=> {
            this.boardCtrl.jpAnswerControl.show(this.model);
            window.parameters.subtype = "answer";
            pushParameters();
        });

        document.querySelector("#jp .question-pane").addEventListener("text-update", event => {
            this.model.q = event.detail.text;
            this.boardCtrl.saveCB();
            console.log(this.model);
        });
    }

    show(model) {
        this.model = model;
        console.log(this.model);

        document.querySelector("#mc").hide();
        document.querySelector("#jp").show();
        document.querySelector("#jp .game-board").hide();
        document.querySelector("#jp .answer-pane").hide();
        document.querySelector("#jp .question-pane").show();
        document.querySelector("#jp .button-container").show();
        document.querySelector("#jp .show-question").disable();
        document.querySelector("#jp .show-answer").enable();
        document.querySelector("#jp .show-board").enable();

        document.querySelector("#menu").querySelector("#menu-decrease-value").hide();
        document.querySelector("#menu").querySelector("#menu-increase-value").hide();

        document.querySelector("#jp .question-pane").setText(this.model.q);
    }
}

class JPAnswerCtrl {
    constructor(boardCtrl) {
        this.boardCtrl = boardCtrl;
        this.setupListeners();
    }

    setupListeners() {
        document.querySelector("#jp .show-question").addEventListener("click", event=> {
            this.boardCtrl.jpQuestionControl.show(this.model);
            window.parameters.subtype = "question";
            pushParameters();
        });

        document.querySelector("#jp .answer-pane").addEventListener("text-update", event => {
            this.model.a = event.detail.text;
            this.boardCtrl.saveCB();
            console.log(this.model);
        });
    }

    show(model) {
        this.model = model;
        console.log("JP Answer");
        console.log(this.model);

        document.querySelector("#mc").hide();
        document.querySelector("#jp").show();
        document.querySelector("#jp .game-board").hide();
        document.querySelector("#jp .answer-pane").show();
        document.querySelector("#jp .question-pane").hide();
        document.querySelector("#jp .button-container").show();
        document.querySelector("#jp .show-question").enable();
        document.querySelector("#jp .show-answer").disable();
        document.querySelector("#jp .show-board").enable();

        document.querySelector("#menu").querySelector("#menu-decrease-value").hide();
        document.querySelector("#menu").querySelector("#menu-increase-value").hide();

        document.querySelector("#jp .answer-pane").setText(this.model.a);
    }
}

class EditorPane {
    constructor(gameDescriptionHelper, fileOps, fileId) {
        this.gameDescriptionHelper = gameDescriptionHelper;
        this.fileOps = fileOps;
        this.fileId = fileId;
        this.DOM = DOM;

        this.DOM.menu = document.querySelector("#menu");
        this.DOM.triangleRight = document.querySelector("#triangle-right");
        this.DOM.triangleLeft = document.querySelector("#triangle-left");
        this.DOM.gameName = document.querySelector("#game-name");
        this.DOM.gameBoard = document.querySelector("#game-board");

        this.jeopardyBoardCtrl = new JPBoardCtrl(()=>this.onSave());

        this.DOM.menu.addEventListener("menu-download", () => {
            console.log("menu download");
            const json = JSON.stringify(this.gameDescriptionHelper.get(), null, 2);
            const blob = new Blob([json], {type: "application/json"});
            const url = window.URL.createObjectURL(blob);
            const anchor = document.querySelector("#download-anchor");
            anchor.href = url;
            anchor.download = this.gameDescriptionHelper.name;
            anchor.click();
        });

        this.DOM.menu.addEventListener("menu-move-right", () => {
            if (this.gameDescriptionHelper.currentRound >= this.gameDescriptionHelper.roundCount - 1) return;
            this.gameDescriptionHelper.setRoundIndex(this.gameDescriptionHelper.currentRound, this.gameDescriptionHelper.currentRound + 1);
            this.gameDescriptionHelper.incrementRound();
            this.updateView();
            this.onSave();
        });

        this.DOM.menu.addEventListener("menu-move-left", () => {
            if (this.gameDescriptionHelper.currentRound <= 0) return;
            this.gameDescriptionHelper.setRoundIndex(this.gameDescriptionHelper.currentRound, this.gameDescriptionHelper.currentRound - 1);
            this.gameDescriptionHelper.decrementRound();
            this.updateView();
            this.onSave();
        });

        this.DOM.menu.addEventListener("menu-remove-round", () => {
            this.gameDescriptionHelper.removeRound();
            this.updateTriangleView();
            this.onSave();
            this.updateView();
        });

        this.DOM.menu.addEventListener("menu-home-screen", () => {
            location.href = constants.locations.HOST;
        });

        this.DOM.menu.addEventListener("menu-increase-value", () => {
            this.gameDescriptionHelper.increaseValue();
            this.onSave();
            this.updateView();
        });

        this.DOM.menu.addEventListener("menu-decrease-value", () => {
            this.gameDescriptionHelper.decreaseValue();
            this.onSave();
            this.updateView();
        });

        this.DOM.menu.addEventListener("menu-add-jeopardy", () => {
            this.gameDescriptionHelper.addRound(emptyCategory);
            this.updateView();
            this.onSave();
        });

        this.DOM.menu.addEventListener("menu-add-mc", () => {
            this.gameDescriptionHelper.addRound(emptyMC);
            this.updateView();
            this.onSave();
        });

        this.DOM.triangleRight.addEventListener("click", () => {
            this.gameDescriptionHelper.incrementRound();
            window.parameters.round = this.gameDescriptionHelper.currentRound;
            this.updateView();
        });

        this.DOM.triangleLeft.addEventListener("click", () => {
            this.gameDescriptionHelper.decrementRound();
            window.parameters.round = this.gameDescriptionHelper.currentRound;
            this.updateView();
        });

        this.DOM.gameName.addEventListener("keypress", async (event) => {
            if (event.which === 13) {
                event.stopPropagation();
                event.preventDefault();
                document.body.focus();
                await this.rename(DOM.gameName.innerText);
                return false;
            }
        });

        this.DOM.gameName.addEventListener("blur", async (event) => {
            await this.rename(DOM.gameName.innerText);
        });

        // game-board change category text
        this.DOM.gameBoard.addEventListener("header-update", event => {
            let col = event.detail.col;
            this.gameDescriptionHelper.getColumn(col).category = event.detail.value;
            this.gameDescriptionHelper.getColumn(col).fontSize = event.detail.fontSize;
            this.onSave();
        });

        this.loadURLState();
        this.updateTriangleView();
    }

    updateView() {
        const currentRound = this.gameDescriptionHelper.getRound();
        if (currentRound.type === SCHEMA_CONSTANTS.CATEGORY){
            this.jeopardyBoardCtrl.show(currentRound);
        }
        if (currentRound.type === SCHEMA_CONSTANTS.MULTIPLE_CHOICE){
            this.mcQuestionCtrl.show(currentRound);
        }
        this.updateTriangleView();
    }

    loadURLState(){
        if (window.parameters.round) {
            this.gameDescriptionHelper.setRound(window.parameters.round);
        } else {
            window.parameters.round = 0;
            pushParameters();
        }

        const currentRound = this.gameDescriptionHelper.getRound();
        if (!window.parameters.type) {
            this.updateView();
        }

        if (window.parameters.type === "jeopardy") {
            this.jeopardyBoardCtrl.setModel(currentRound);
            const row = window.parameters.row;
            const col = window.parameters.col;
            if (window.parameters.subtype === 'question') {
                this.jeopardyBoardCtrl.jpQuestionControl.show(
                    this.gameDescriptionHelper.getRound().column[col].cell[row]
                );
            } else if (window.parameters.subtype === 'answer') {
                this.jeopardyBoardCtrl.jpAnswerControl.show(
                    this.gameDescriptionHelper.getRound().column[col].cell[row]
                );
            } else {
                this.jeopardyBoardCtrl.show();
            }
        } else {
            if (window.parameters.subtype === 'answer') {
                this.mcAnswerCtrl.show(currentRound);
            } else if (window.parameters.subtype === 'question') {
                this.mcQuestionCtrl.show(currentRound);
            }
        }
    }

    async rename(newName) {
        this.gameDescriptionHelper.name = newName;
        if (this.fileId) await this.fileOps.rename(this.fileId, newName + ".json");
        await this.onSave();
    }

    async onSave() {
        if (this.fileId) {
            let jsonString = JSON.stringify(this.gameDescriptionHelper.get(), null, 2);
            await this.fileOps.setBody(this.fileId, jsonString);
        }
    }

    updateTriangleView() {
        this.DOM.triangleLeft.classList.remove("hidden");
        this.DOM.triangleRight.classList.remove("hidden");

        if (this.gameDescriptionHelper.currentRound <= 0) {
            this.DOM.triangleLeft.classList.add("hidden");
        }
        if (this.gameDescriptionHelper.currentRound >= this.gameDescriptionHelper.roundCount - 1) {
            this.DOM.triangleRight.classList.add("hidden");
        }
        document.querySelector("#round-number > .text").textContent = "Round " + (parseInt(this.gameDescriptionHelper.currentRound) + 1);
    }
}

export default EditorPane;