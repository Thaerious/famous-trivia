import constants from "../constants.js";

class GameNotStarted {
    getUpdate(external_update) {
        external_update.round = {
            style: constants.GAME_MODEL_STYLE.NOT_STARTED,
        };

        return external_update;
    }
}

export default GameNotStarted;
