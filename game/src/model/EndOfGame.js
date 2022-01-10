import constants from "../constants.js";

class EndOfGame {
    getUpdate (externalUpdate = {}) {
        externalUpdate.round = {
            style: constants.GAME_MODEL_STYLE.END_OF_GAME
        };
        return externalUpdate;
    }
}

export default EndOfGame;
