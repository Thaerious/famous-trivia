import {GAME_MODEL_STYLE, GAME_MODEL_STATES} from "../constants.js";

class MultipleChoiceModel {
    constructor(descriptionModel) {
        this.descriptionModel = descriptionModel;
        this.stateData = {
            style: GAME_MODEL_STYLE.MULTIPLE_CHOICE,
        };
    }

    /**
     * Set the state data for the specified question question.
     * @param col
     * @param row
     * @returns question text
     */
    setQuestionState() {
        Object.assign(this.stateData, {
            state: GAME_MODEL_STATES.QUESTION,
            question: this.descriptionModel.question
        });

        return this.stateData;
    }

    /**
     * Set the state showing the players the answers.
     * This hides the values (in/correct answers).
     * @param col
     * @param row
     * @returns question text
     */
    setAnswerState() {
        Object.assign(this.stateData, {
            'state': GAME_MODEL_STATES.ANSWER,
            'answers': this.descriptionModel.options
        });

        return this.stateData;
    }

    /**
     * Set the state revealing the correct answer to the player
     */
    setRevealState() {
        this.setAnswerState();
        Object.assign(this.stateData, {
            state: GAME_MODEL_STATES.REVEAL,
            'correct-answer': this.getAnswer()
        });
        return this.stateData;
    }

    getAnswer() {
        return parseInt(this.descriptionModel['correct-answer']);
    }

    /**
     * Retrieve an update with all information.
     */
   getUpdate() {
       const r = {
           round : this.stateData
       }
        return JSON.parse(JSON.stringify(r));
    }
}

export default MultipleChoiceModel;