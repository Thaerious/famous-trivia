import {GAME_MODEL_STYLE, GAME_MODEL_STATES} from "../constants.js";
import {LIGHT_STATE} from "../constants.js";

class JeopardyModel {
    /**
     * @param parent the GameModel object that constructed this
     * @param model the JSON model of questions
     */
    constructor(parent, model) {
        this.parent = parent;
        this.model = model;
        this.spentPlayers = [];

        /** matrix of which questions have already been answered **/
        this.spent = [];
        for (let col of this.model.column) {
            let cells = [];
            this.spent.push(cells);
            for (let cell of col.cell) {
                cells.push(false);
            }
        }

        this.stateData = {
            style: GAME_MODEL_STYLE.JEOPARDY,
            state: GAME_MODEL_STATES.BOARD,
            spent: this.spent
        };

        this.categories = [];
        this.values = [];

        for (let column of this.model.column) {
            this.categories.push({
                "text": column.category,
                "font-size": column.fontSize
            });
            let valueCol = [];
            this.values.push(valueCol);
            for (let cell of column.cell) {
                valueCol.push(cell.value);
            }
        }
    }

    isPlayerSpent(name) {
        return this.spentPlayers.indexOf(name) !== -1;
    }

    /**
     * Mark the current player as spent.
     * @returns {boolean}
     */
    setPlayerSpent() {
        const name = this.getCurrentPlayer();
        if (this.stateData.state !== GAME_MODEL_STATES.QUESTION) return false;
        if (!name) return false;
        if (this.isPlayerSpent(name)) return true;
        this.spentPlayers.push(name);
        return true;
    }

    setCurrentPlayer(name) {
        if (!this.parent.hasPlayer(name)) return false;
        this.currentPlayer = name;
        return true;
    }

    clearCurrentPlayer() {
        this.currentPlayer = '';
    }

    /** return true if name is unspent and is a name*/
    hasPlayer(name) {
        if (!this.parent.hasPlayer(name)) return false;
        return this.isPlayerSpent(name) === false;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    /**
     * return the number of unspent players.
     * @returns {*}
     */
    countUnspentPlayers() {
        return this.parent.players.length - this.spentPlayers.length;
    }

    isSpent(col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.spent[col][row];
    }

    /**
     * State indicating no question has been selected.
     * @param col
     * @param row
     * @returns question text
     */
    setBoardState(col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.stateData = {
            style: GAME_MODEL_STYLE.JEOPARDY,
            state: GAME_MODEL_STATES.BOARD,
            spent: this.spent
        };

        return this.stateData;
    }

    /**
     * State indicating that a question has been selected.
     * @param col
     * @param row
     * @returns question text
     */
    setQuestionState(col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.stateData = {
            style: GAME_MODEL_STYLE.JEOPARDY,
            state: GAME_MODEL_STATES.QUESTION,
            col: col,
            row: row,
            type: this.getType(col, row),
            question: this.model.column[col].cell[row].q,
            spent: this.spent
        };

        return this.stateData;
    }

    /**
     *
     * Set the game model state to "show answer".
     * The setQuestionState must be called first.
     * @param col
     * @param row
     * @returns game state update object
     */
    setRevealState(col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.spent[col][row] = true;

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.stateData = {
            style: GAME_MODEL_STYLE.JEOPARDY,
            state: GAME_MODEL_STATES.REVEAL,
            col: col,
            row: row,
            type: this.getType(col, row),
            question: this.model.column[col].cell[row].q,
            answer: this.getAnswer(),
            spent: this.spent
        };

        return this.stateData;
    }

    /**
     * Retrieve the answer for the current question.
     * If row and column are omitted, use the row/col from the
     * most recent previous getQuestion.
     * @param col
     * @param row
     * @returns game state update object
     */
    getAnswer(col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.model.column[col].cell[row].a;
    }

    /**
     * Retrieve the point value for the specified question.
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @returns {*}
     */
    getValue(col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.model.column[col].cell[row].value;
    }

    /**
     * Retrieve the question type
     * If row and column are omitted, use the row/col from the
     * most recent previous setQuestionState.
     * @param col
     * @param row
     * @returns game state update object
     */
    getType(col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.model.column[col].cell[row].type;
    }

    getUpdate() {
        const players = this.parent.players;

        for (let player of players) {
            if (player.name === this.currentPlayer) {
                player.light_state = LIGHT_STATE.HIGHLIGHT;
            }
            else if (this.spentPlayers.indexOf(player.name) !== -1) {
                player.light_state = LIGHT_STATE.DIM;
            }
            else {
                player.light_state = LIGHT_STATE.NORMAL;
            }
        }

        const r = {
            round : {
                current_player : this.currentPlayer,
                categories : this.categories,
                values : this.values
            },
            players : players
        }

        Object.assign(r.round, this.stateData);
        return r;
    }

    /**
     * Ensure that col is between 0 ... 6 & row is between 0 ... 5
     * @param col
     * @param row
     * @returns {*[]}
     */
    checkTableBounds(col, row){
        col = col ?? this.stateData.col;
        row = row ?? this.stateData.row;

        if (col < 0 || col > 5) throw new Error(`Column out of range: ${col}`);
        if (row < 0 || row > 4) throw new Error(`Row out of range: ${row}`);
        return [col, row];
    }
}

export default JeopardyModel;