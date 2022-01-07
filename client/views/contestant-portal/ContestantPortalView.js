import AbstractView from "../modules/AbstractView.js";
import ViewEvent from "../modules/ViewEvent.js";

class ContestantPortalView extends AbstractView {
    constructor() {
        super();
        this.DOM.questionButton = document.querySelector("#show-question");
        this.DOM.buzzButton = document.querySelector("#buzz");
        this.DOM.selfPanel = document.querySelector("#self-panel");
        this.DOM.questionPopup = document.querySelector("#question-popup");

        this.DOM.questionButton.addEventListener("click", event=>this.DOM.questionPopup.show());
        this.DOM.buzzButton.addEventListener("click", e => this.dispatchEvent(new ViewEvent("buzz")));
        this.DOM.gameBoard.addEventListener("cell-select", e => this.dispatchEvent(new ViewEvent("select", e.detail)));
        this.DOM.multipleChoice.addEventListener("value-update", e => this.dispatchEvent(new ViewEvent("update", e.detail)));
    }

    setName(name) {
        this.name = name;
        this.DOM.selfPanel.name = "Score";
        document.title = name;
    }

    updateModel(update) {
        super.updateModel(update);
        this.DOM.buzzButton.hide();
        this.DOM.questionButton.hide();

        for (let player of update.model.players) {
            if (player.name === this.name) {
                this.DOM.selfPanel.score = player.score;
                break;
            }
        }

        switch (update.state) {
            case 2:
                this.DOM.questionButton.show();
                this.DOM.questionPopup.querySelector("#text-contents").text = update.model.round.question;
                this.DOM.multipleChoice.setMode("data-enter");
                for (let i = 0; i < 6; i++) {
                    this.DOM.multipleChoice.setAnswerText(i, update.model.round.answers[i]);
                }
                break;
            case 3:
                this.DOM.multipleChoice.setMode("data-enter");
                this.DOM.multipleChoice.querySelector(".row.total").show();
                let total = 0;

                if (update.bets[this.name].bonus !== 0) {
                    this.DOM.multipleChoice.querySelector(".row.bonus > .amount").text = update.bets[this.name].bonus;
                    total += update.bets[this.name].bonus;
                }
                else {
                    this.DOM.multipleChoice.querySelector(".row.bonus > .amount").text = 0;
                }

                for (let i = 0; i < 6; i++) {
                    let wagerElement = this.DOM.multipleChoice.querySelector(`[data-index="${i}"] .wager`);
                    let value = update.bets[this.name].answers[i].amount;
                    wagerElement.content = value;
                    total += value;
                }

                this.DOM.multipleChoice.querySelector(".row.total > .amount").text = total;
                break;
            case 7:
                console.log(update);
                let check = update.model.round.spent_players.indexOf(this.name);
                if (update.model.round.spent_players.indexOf(this.name) === -1) {
                    this.DOM.buzzButton.show();
                }
                break;
        }
    }
}

export default ContestantPortalView;