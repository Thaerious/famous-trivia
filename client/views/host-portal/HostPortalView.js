import AbstractView from "../modules/AbstractView.js"
import ViewEvent from "../modules/ViewEvent.js";

/**
 * HostPortalView has methods to control the visibility/details of DOM objects.
 * This class will fire "click" events when buttons are clicked, with the data
 * in the format that will get sent to the server.  The HostPortalController
 * takes care of the communication details.
 *
 * The cell-select event is caught and re-dispatched.
 */
class HostPortalView extends AbstractView{

    constructor() {
        super();
        this.DOM.acceptButton = document.querySelector("#accept");
        this.DOM.rejectButton = document.querySelector("#reject");
        this.DOM.backButton = document.querySelector("#back");
        this.DOM.continueButton = document.querySelector("#continue");
        this.DOM.nextButton = document.querySelector("#next");
        this.DOM.startButton = document.querySelector("#start");
        this.DOM.answer = document.querySelector("#answer");

        this.DOM.acceptButton.addEventListener("click",  e => this.dispatchEvent(new ViewEvent("accept")));
        this.DOM.rejectButton.addEventListener("click",  e => this.dispatchEvent(new ViewEvent("reject")));
        this.DOM.backButton.addEventListener("click",  e => this.dispatchEvent(new ViewEvent("back")));
        this.DOM.continueButton.addEventListener("click",  e => this.dispatchEvent(new ViewEvent("continue")));
        this.DOM.nextButton.addEventListener("click",  e => this.dispatchEvent(new ViewEvent("next")));
        this.DOM.startButton.addEventListener("click", e => this.dispatchEvent(new ViewEvent("start")));
        this.DOM.gameBoard.addEventListener("cell-select", e => this.dispatchEvent(new ViewEvent("select", e.detail)));
    }

    updateModel(update) {
        super.updateModel(update);
        this.DOM.acceptButton.hide();
        this.DOM.rejectButton.hide();
        this.DOM.backButton.hide();
        this.DOM.continueButton.hide();
        this.DOM.nextButton.hide();
        this.DOM.startButton.hide();
        this.DOM.answer.hide();

        this.DOM.continueButton.classList.remove("center");
        this.DOM.continueButton.classList.add("right");

        this.DOM.playerContainerLeft

        switch (update.state) {
            case 0:
                this.DOM.startButton.show();
                break;
            case 1:
                this.DOM.continueButton.show();
                this.DOM.continueButton.classList.add("center");
                this.DOM.continueButton.classList.remove("right");
                break;
            case 2:
                break;
            case 3:
                this.DOM.timer.hide();
                this.DOM.continueButton.show();
                this.DOM.continueButton.classList.add("center");
                this.DOM.continueButton.classList.remove("right");
                break;
            case 4:
                break;
            case 5:
                this.DOM.backButton.show();
                this.DOM.continueButton.show();
                this.DOM.continueButton.classList.add("right");
                this.DOM.continueButton.classList.remove("center");
                this.DOM.answer.show();
                break;
            case 6:
                this.DOM.acceptButton.show();
                this.DOM.rejectButton.show();
                this.DOM.timer.show();
                this.DOM.answer.show();
                break;
            case 7:
                break;
            case 8:
                this.DOM.acceptButton.show();
                this.DOM.rejectButton.show();
                this.DOM.answer.show();
                break;
            case 9:
                this.DOM.continueButton.show();
                this.DOM.continueButton.classList.remove("right");
                this.DOM.continueButton.classList.add("center");
                break;
            default:
                break;
        }
    }

    updateAnswer(answer){
        this.DOM.answer.text = answer;
    }
}

export default HostPortalView;