import {GAME_MODEL_STYLE} from "../constants.js";

class EndOfGame {
    getUpdate() {
        return {
            round : {
                style: GAME_MODEL_STYLE.END_OF_GAME
            }
        }
    }
}

export default EndOfGame;