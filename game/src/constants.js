// Indicates the state of a player card

const LIGHT_STATE = {
    HIGHLIGHT: "highlight",
    NORMAL: "normal",
    DIM: "dim"
}

const GAME_MODEL_STATES = {
    NOT_SET: "notset",
    QUESTION: "question",
    ANSWER: "answer",
    REVEAL: "reveal",
    BOARD: "board"
}

const GAME_MODEL_STYLE = {
    NOT_STARTED: "ns",
    MULTIPLE_CHOICE: "mc",
    JEOPARDY: "j",
    END_OF_GAME: "end"
}

export {LIGHT_STATE, GAME_MODEL_STATES, GAME_MODEL_STYLE};