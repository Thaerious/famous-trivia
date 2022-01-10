import constants from "../constants.js";

class JeopardyModel {
    /**
     * @param parent the GameModel object that constructed this
     * @param model the JSON model of questions
     */
    constructor (parent, model) {
        this.parent = parent;
        this.model = model;
        this.spentPlayers = [];

        /** matrix of which questions have already been answered **/
        this.spent = [];
        for (let i = 0; i < this.model.column.length; i++) {
            const cells = [];
            this.spent.push(cells);
            for (let j = 0; j < cells.length; j++) {
                cells.push(false);
            }
        }

        this.state_data = {
            style: constants.GAME_MODEL_STYLE.JEOPARDY,
            state: constants.GAME_MODEL_STATES.BOARD,
            spent: this.spent
        };

        this.categories = [];
        this.values = [];

        for (const column of this.model.column) {
            this.categories.push({
                text: column.category,
                "font-size": column.fontSize
            });
            const valueCol = [];
            this.values.push(valueCol);
            for (const cell of column.cell) {
                valueCol.push(cell.value);
            }
        }
    }

    isPlayerSpent (name) {
        return this.spentPlayers.indexOf(name) !== -1;
    }

    /**
     * Mark the current player as spent.
     * @returns {boolean}
     */
    setPlayerSpent () {
        const name = this.getCurrentPlayer();
        if (this.state_data.state !== constants.GAME_MODEL_STATES.QUESTION) return false;
        if (!name) return false;
        if (this.isPlayerSpent(name)) return true;
        this.spentPlayers.push(name);
        return true;
    }

    setCurrentPlayer (name) {
        if (!this.parent.hasPlayer(name)) return false;
        this.currentPlayer = name;
        return true;
    }

    clearCurrentPlayer () {
        this.currentPlayer = ``;
    }

    /** return true if name is unspent and is a name */
    hasPlayer (name) {
        if (!this.parent.hasPlayer(name)) return false;
        return this.isPlayerSpent(name) === false;
    }

    getCurrentPlayer () {
        return this.currentPlayer;
    }

    /**
     * If the player removed is the current player and the player is not spent,
     * The next player becomes the current player.
     * If the player is spent, the current player becomes blank.
     * (Players become spent by selecting a question or buzzing in)
     * (If the current player is unspent, it means they have not selected a qustion)
     */
    removePlayer (name) {
        if (name === this.currentPlayer) {
            if (!this.isPlayerSpent(name)) {
                this.currentPlayer = this.parent.players[0].name;
            } else {
                this.currentPlayer = ``;
            }
        }
    }

    /**
     * return the number of unspent players.
     * @returns {*}
     */
    countUnspentPlayers () {
        return this.parent.players.length - this.spentPlayers.length;
    }

    isLowestUnspent (col, row) {
        [col, row] = this.checkTableBounds(col, row);
        if (row === 0) return true;
        for (let r = row; r > 0; r--) {
            if (!this.isSpent(col, r - 1)) return false;
        }
        return true;
    }

    isSpent (col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.spent[col][row];
    }

    /**
     * State indicating no question has been selected.
     * @param col
     * @param row
     * @returns question text
     */
    setBoardState (col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.state_data = {
            style: constants.GAME_MODEL_STYLE.JEOPARDY,
            state: constants.GAME_MODEL_STATES.BOARD,
            spent: this.spent
        };

        return this.state_data;
    }

    /**
     * State indicating that a question has been selected.
     * @param col
     * @param row
     * @returns question text
     */
    setQuestionState (col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.state_data = {
            style: constants.GAME_MODEL_STYLE.JEOPARDY,
            state: constants.GAME_MODEL_STATES.QUESTION,
            col: col,
            row: row,
            type: this.getType(col, row),
            question: this.model.column[col].cell[row].q,
            spent: this.spent
        };

        return this.state_data;
    }

    /**
     *
     * Set the game model state to "show answer".
     * The setQuestionState must be called first.
     * @param col
     * @param row
     * @returns game state update object
     */
    setRevealState (col, row) {
        [col, row] = this.checkTableBounds(col, row);

        this.spent[col][row] = true;

        this.currentPlayer = this.parent.players[0].name;
        this.spentPlayers = [];

        this.state_data = {
            style: constants.GAME_MODEL_STYLE.JEOPARDY,
            state: constants.GAME_MODEL_STATES.REVEAL,
            col: col,
            row: row,
            type: this.getType(col, row),
            question: this.model.column[col].cell[row].q,
            answer: this.getAnswer(),
            spent: this.spent
        };

        return this.state_data;
    }

    /**
     * Retrieve the answer for the current question.
     * If row and column are omitted, use the row/col from the
     * most recent previous getQuestion.
     * @param col
     * @param row
     * @returns game state update object
     */
    getAnswer (col, row) {
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
    getValue (col, row) {
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
    getType (col, row) {
        [col, row] = this.checkTableBounds(col, row);
        return this.model.column[col].cell[row].type;
    }

    getUpdate (external_update = {}) {
        const players = this.parent.players;

        for (const player of players) {
            if (player.name === this.currentPlayer) {
                player.light_state = constants.LIGHT_STATE.HIGHLIGHT;
            } else if (this.spentPlayers.indexOf(player.name) !== -1) {
                player.light_state = constants.LIGHT_STATE.DIM;
            } else {
                player.light_state = constants.LIGHT_STATE.NORMAL;
            }
        }

        external_update.round = {
            current_player: this.currentPlayer,
            categories: this.categories,
            values: this.values,
            spent_players: [...this.spentPlayers]
        };

        external_update.players = players;
        Object.assign(external_update.round, this.state_data);

        return JSON.parse(JSON.stringify(external_update));
    }

    /**
     * Ensure that col is between 0 ... 6 & row is between 0 ... 5
     * @param col
     * @param row
     * @returns {*[]}
     */
    checkTableBounds (col, row) {
        col = col ?? this.state_data.col;
        row = row ?? this.state_data.row;

        if (col < 0 || col > 5) throw new Error(`Column out of range: ${col}`);
        if (row < 0 || row > 4) throw new Error(`Row out of range: ${row}`);
        return [col, row];
    }
}

export default JeopardyModel;
