import {GAME_MODEL_STYLE} from "../constants.js";

class GameNotStarted {
    getUpdate() {
        return {
            round : {
                style: GAME_MODEL_STYLE.NOT_STARTED
            }
        }
    }
}

export default GameNotStarted;