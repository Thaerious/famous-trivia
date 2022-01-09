import constants from "../constants.js";

class EndOfGame {
    getUpdate(external_update = {}) {
        external_update.round = {
            style: constants.GAME_MODEL_STYLE.END_OF_GAME,
        };
        return external_update;
    }
}

export default EndOfGame;
