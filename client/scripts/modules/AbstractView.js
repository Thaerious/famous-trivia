class AbstractView extends EventTarget{
    constructor() {
        super();
        this.DOM = {};

        this.DOM.gameBoard = document.querySelector("game-board");
        this.DOM.questionPane = document.querySelector("#question-pane");
        this.DOM.multipleChoice = document.querySelector("#multiple-choice-present");

        this.DOM.playing_indicator = document.querySelector("#playing");
        this.DOM.timer = document.querySelector("trivia-timer");

        this.DOM.menuIndicator = document.querySelector("#menu-indicator");
        this.DOM.menuArea = document.querySelector("#menu-area");
        this.DOM.menuLogout = document.querySelector("#menu-logout");

        this.DOM.playerContainer = document.querySelector("#player-container");
    }

    startTimer(update){
        this.DOM.timer.show(update.time);
    }

    updateTimer(update){
        if (this.lastUpdate.model.players.length <= 0) return;
        this.DOM.timer.show();
        this.DOM.timer.set(update.time);

        if (this.lastUpdate.state === 6 || this.lastUpdate.state === 8) {
            let currentName = this.lastUpdate.model.players[0].name;
            let currentPanel = this.DOM.playerContainer.topPlayer();
            currentPanel.setTimer(update.progress);
        }
    }

    updateModel(update){
        this.DOM.playerContainer.setPlayers(update.model.players);
        this.lastUpdate = update;

        this.DOM.multipleChoice.hide();

        switch (update.state){
            case 0:
                break;
            case 1:
                this.DOM.multipleChoice.hide();
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.question);
                this.DOM.timer.hide();
                break;
            case 2:
                this.DOM.questionPane.hide();
                this.DOM.multipleChoice.show();
                this.DOM.multipleChoice.setMode("show");
                this.DOM.multipleChoice.querySelector(".row.total").hide();
                this.DOM.multipleChoice.querySelector(".row.bonus > .amount").text = update.model.round.bonus;
                for (let i = 0; i < 6; i++) {
                    this.DOM.multipleChoice.querySelector(`[data-index="${i}"] check-box`).checked = false;
                    this.DOM.multipleChoice.setAnswerText(i, update.model.round.answers[i]);
                    this.DOM.multipleChoice.querySelector(`[data-index="${i}"] check-box`).locked = false;
                }
                break;
            case 3:
                this.DOM.questionPane.hide();
                this.DOM.multipleChoice.show();
                this.DOM.multipleChoice.setMode("show");

                for (let i = 0; i < 6; i++) {
                    this.DOM.multipleChoice.setAnswerText(i, update.model.round.answers[i]);
                    this.DOM.multipleChoice.querySelector(`[data-index="${i}"] check-box`).checked = update.model.round.values[i];
                    this.DOM.multipleChoice.querySelector(`[data-index="${i}"] check-box`).locked = true;
                }
                break;
            case 4:
                this.DOM.gameBoard.show();
                this.fillJeopardyCategories(update);
                this.fillJeopardyCells(update);
                this.DOM.timer.hide();
                break;
            case 5:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.question);
                this.DOM.timer.hide();
                break;
            case 6:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.question);
                this.DOM.playerContainer.moveToTop(update.model.round.current_player);
                break;
            case 7:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.question);
                break;
            case 8:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.question);
                this.DOM.playerContainer.moveToTop(update.model.round.current_player);
                break;
            case 9:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText(update.model.round.answer);
                this.DOM.timer.hide();
                break;
            case 10:
                this.DOM.gameBoard.hide();
                this.DOM.questionPane.show();
                this.DOM.questionPane.setText("GAME OVER");
                this.DOM.timer.hide();
                break;
            default:
                break;
        }
    }

    fillJeopardyCategories(update){
        for (let i = 0; i < 6; i++){
            let category = update.model.round.categories[i];
            this.DOM.gameBoard.setHeader(i, category["text"], category["font-size"], true)
        }
    }

    fillJeopardyCells(update){
        let round = update.model.round;
        for (let c = 0; c < 6; c++){
            for (let r = 0; r < 5; r++){
                if (round.spent[c][r]){
                    this.DOM.gameBoard.setCell(r, c, "");
                } else {
                    this.DOM.gameBoard.setCell(r, c, round.values[c][r]);
                }
            }
        }
    }
}

module.exports = AbstractView;