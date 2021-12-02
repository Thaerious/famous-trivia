/**
 * Game Description Model
 *
 * The model represents a set of game questions.
 * This is not a game in action, thus has no player information.
 * For a the game instance model, see GameModel.
 */

class GameDescriptionHelper {

    set name(string) {
        this.gameModel.name = string;
    }

    get name() {
        return this.gameModel.name;
    }

    set(gameModel) {
        this.currentRound = 0;
        this.gameModel = gameModel;
        return this;
    }

    get() {
        return this.gameModel;
    }

    toJSON(){
        return JSON.stringify(this.get, null, 2);
    }

    getRound(index) {
        index = index ?? this.currentRound;
        return this.gameModel.rounds[index];
    }

    setRoundIndex(from, to){
        let r = this.gameModel.rounds;
        if (r.length <= 1) return;
        [r[from], r[to]] = [r[to], r[from]];
    }

    getColumn(index) {
        return this.getRound().column[index];
    }

    getCell(row, column) {
        return this.getColumn(column).cell[row];
    }

    removeRound() {
        if (this.roundCount === 1) return;
        this.gameModel.rounds.splice(this.currentRound, 1);
        if (this.currentRound >= this.roundCount) this.currentRound = this.roundCount - 1;
    }

    /**
     * Add a deep copy of 'roundObject' to the end of the rounds list.
     *
     * On using JSON for deepcopy:
     * This only works if you don't need to clone functions, or have undefined values. JSON will ignore all
     * functions and undefined values.
     * @param {object} roundObject
     */
    addRound(roundObject) {
        const deepCopy = JSON.parse(JSON.stringify(roundObject));
        this.gameModel.rounds.push(deepCopy);
    }

    get roundCount() {
        return this.gameModel.rounds.length;
    }

    setRound(value){
        this.currentRound = value;
        if (this.currentRound < 0) this.currentRound = 0
        if (this.currentRound >= this.roundCount) this.currentRound = this.roundCount - 1;
    }

    incrementRound(){
        this.currentRound++;
        if (this.currentRound >= this.roundCount) this.currentRound = this.roundCount - 1;
    }

    decrementRound(){
        this.currentRound--;
        if (this.currentRound < 0) this.currentRound = 0
    }

    increaseValue() {
        let round = this.getRound();

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                round.column[i].cell[j].value *= 2;
            }
        }
    }

    decreaseValue() {
        let round = this.getRound();

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                round.column[i].cell[j].value /= 2;
            }
        }
    }
}

export default GameDescriptionHelper;