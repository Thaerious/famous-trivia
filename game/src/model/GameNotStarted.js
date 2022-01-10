import constants from "../constants.js";

class GameNotStarted {
    getUpdate (externalUpdate = {}) {
        externalUpdate.round = {
            style: constants.GAME_MODEL_STYLE.NOT_STARTED
        };

        return externalUpdate;
    }
}

export default GameNotStarted;
