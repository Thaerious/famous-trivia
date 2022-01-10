// Indicates the state of a player card

export default {
    LIGHT_STATE: {
        HIGHLIGHT: `highlight`,
        NORMAL: `normal`,
        DIM: `dim`
    },

    GAME_MODEL_STATES: {
        NOT_SET: `notset`,
        QUESTION: `question`,
        ANSWER: `answer`,
        REVEAL: `reveal`,
        BOARD: `board`
    },

    GAME_MODEL_STYLE: {
        NOT_STARTED: `ns`,
        JEOPARDY: `j`,
        END_OF_GAME: `end`
    },

    SCHEMA_CONSTANTS: {
        CATEGORY: `categorical`,
        MULTIPLE_CHOICE: `multiple_choice`
    },

    NAMES: {
        HOST: `@HOST`
    }
};
