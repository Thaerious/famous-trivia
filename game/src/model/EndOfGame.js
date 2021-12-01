import constants from "../constants.js";

class EndOfGame {
    getUpdate() {
        return {
            round : {
                style: constants.GAME_MODEL_STYLE.END_OF_GAME
            }
        }
    }
}

export default EndOfGame;