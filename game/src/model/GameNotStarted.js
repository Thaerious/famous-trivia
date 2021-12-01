import constants from "../constants.js";

class GameNotStarted {
    getUpdate() {
        return {
            round : {
                style: constants.GAME_MODEL_STYLE.NOT_STARTED
            }
        }
    }
}

export default GameNotStarted;