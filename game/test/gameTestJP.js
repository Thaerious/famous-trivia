// noinspection DuplicatedCode
import assert from 'assert';
import * as Partials from "./partials/game_partials.js"
import {GAME_MODEL_STYLE, GAME_MODEL_STATES} from "../src/constants.js";

function situationSetup(path) {
    const game = Partials.newGame(path);

    describe('situation setup', function () {
        Partials.playerJoinsGame(game, "Adam");
        Partials.playerJoinsGame(game, "Barkley");
        Partials.playerJoinsGame(game, "Chuck");
        Partials.playerJoinsGame(game, "Davidson");
        Partials.assertState(game, 0);

        Partials.test(`Host starts game`, () => {
            game.onInput({action: "start"});
        });
        Partials.assertState(game, 4);

        Partials.test(`Game type is categorical`, () => {
            const type = game.getUpdate().data.model.round.style;
            assert.strictEqual(type, GAME_MODEL_STYLE.JEOPARDY);
        });
    });

    return game;
}

function hostSelectsQuestion(game, col, row, expected) {
    describe(`host selects c:${col} r:${row}`, function () {
        it(`perform action`, () => {
            game.onInput({player: "@HOST", action: "select", data: {col: col, row: row}});
        });
    });
}

function hostAcceptsAnswer(game) {
    describe("host accepts answer", () => {
        it("action", () => {
            game.onInput({player: "@HOST", action: "accept"})
        });
    });
}

function hostRejectsAnswer(game) {
    describe("Host accepts answer", () => {
        it("action", () => {
            game.onInput({player: "@HOST", action: "reject"})
        });
    });
}

function hostContinues(game) {
    describe("Host accepts answer", () => {
        it("action", () => {
            game.onInput({player: "@HOST", action: "continue"})
        });
    });
}

function verifySpent(game, col, row, value = true) {
    describe('question ${col} x ${row} is spent', function () {
        it(`verify`, () => {
            const actual = game.getUpdate().data.model.round.spent[col][row];
            assert.strictEqual(actual, value);
        });
    });
}

function playerBuzzes(game, player) {
    describe(`${player} buzzes in`, () => {
        it("action", () => {
            game.onInput({action: "buzz", player: player});
        });
    });
};

function post(game) {
    describe("POST", () => {
        it("", () => {
            console.log(game.getUpdate().data.model);
        });
    });
};

describe(`gameTestJP.js : functionality test`, () => {

    describe("player is only spent when a question is selected #SPENT", () => {
        const game = situationSetup('test/data/test-data-04.json');

        Partials.verifyRound(game, {
            current_player: 'Adam',
        });

        hostSelectsQuestion(game, 0, 0);

        Partials.verifyRound(game, {
            current_player: 'Adam',
        });
    });

    describe("test back button", () => {
        const game = situationSetup('test/data/test-data-04.json');

        describe("turn 1", () => {
            Partials.verifyRound(game, "before question is selected", {
                current_player: 'Adam',
            });

            hostSelectsQuestion(game, 0, 0);
            Partials.assertState(game, 5);

            Partials.verifyRound(game, "after question is selected", {
                current_player: 'Adam',
                col: 0,
                row: 0,
                question: 'Q 1.1.1'
            });

            Partials.test("host selects back", () => {
                game.onInput({player: "@HOST", action: "back"})
            });

            Partials.verifyRound(game, "after back is pressed", {
                current_player: 'Adam',
            });

            Partials.assertState(game, 4);
        });
    });

    describe("next round players stay in same order", () => {
        const game = situationSetup('test/data/test-data-04.json');

        describe("turn 1", () => {
            hostSelectsQuestion(game, 0, 0);
            Partials.assertState(game, 5);

            Partials.verifyRound(game, "question has been selected", {
                current_player: 'Adam',
                col: 0,
                row: 0,
                question: 'Q 1.1.1'
            })

            hostContinues(game);
            Partials.assertState(game, 6);
            hostAcceptsAnswer(game);
            Partials.assertState(game, 9);
            hostContinues(game);
            Partials.assertState(game, 4);

            Partials.verifyRound(game, "after question asked and answered", {
                current_player: 'Barkley',
            })

            Partials.verifyScores(game, {
                "Adam": 100,
                "Barkley": 0,
                "Chuck": 0,
                "Davidson": 0
            });

            Partials.verifyScores()

            Partials.test("host advances round", () => {
                game.onInput({player: "@HOST", action: "next_round"})
            });

            Partials.verifyRound(game, "after advancing the round", {
                current_player: 'Barkley',
            })
        });
    });

    describe("demo game 1 #PLAY_GAME", () => {
        const game = situationSetup('test/data/test-data-04.json');

        describe("turn 1 - basic round, question asked and answered successfully", () => {
            hostSelectsQuestion(game, 0, 0);
            Partials.assertState(game, 5);

            Partials.verifyRound(game, {
                current_player: 'Adam',
                col: 0,
                row: 0,
                question: 'Q 1.1.1'
            })

            hostContinues(game);
            Partials.assertState(game, 6);
            hostAcceptsAnswer(game);
            Partials.assertState(game, 9);
            hostContinues(game);
            Partials.assertState(game, 4);

            Partials.verifyRound(game, {
                current_player: 'Barkley',
            })

            Partials.verifyScores(game, {
                "Adam": 100,
                "Barkley": 0,
                "Chuck": 0,
                "Davidson": 0
            });
        });

        describe("turn 2 - 2 players become spent", () => {
            hostSelectsQuestion(game, 1, 0);
            Partials.assertState(game, 5);

            Partials.verifyRound(game, {
                current_player: 'Barkley',
                col: 1,
                row: 0,
                question: 'Q 1.2.1'
            })

            hostContinues(game);
            Partials.assertState(game, 6);

            describe("Host rejects the answer, advancing state", () => {
                hostRejectsAnswer(game);
                Partials.assertState(game, 7);

                Partials.verifyRound(game, "Barkley becomes spent, no current player", {
                    current_player: '',
                })
            });

            describe("Chuck buzzes in and has answer rejected", () => {
                playerBuzzes(game, "Chuck");
                Partials.assertState(game, 8);

                Partials.verifyRound(game, "Chuck is now spent as well", {
                    current_player: 'Chuck',
                    col: 1,
                    row: 0,
                    question: 'Q 1.2.1'
                })

                hostRejectsAnswer(game);
            });

            Partials.verifyScores(game, {
                "Adam": 100,
                "Barkley": 0,
                "Chuck": -50,
                "Davidson": 0
            });
        });
    });

    describe("all players get answer rejected", () => {
        const game = situationSetup('test/data/test-data-04.json');

        describe("turn 1", () => {
            hostSelectsQuestion(game, 0, 0);
            Partials.assertState(game, 5);

            Partials.verifyRound(game, {
                current_player: 'Adam',
                col: 0,
                row: 0,
                question: 'Q 1.1.1'
            });

            hostContinues(game);
            Partials.assertState(game, 6);
            hostRejectsAnswer(game);
            Partials.assertState(game, 7);

            playerBuzzes(game, "Chuck");
            hostRejectsAnswer(game);
            Partials.assertState(game, 7);

            playerBuzzes(game, "Davidson");
            hostRejectsAnswer(game);
            Partials.assertState(game, 7);

            playerBuzzes(game, "Barkley");
            hostRejectsAnswer(game);
            Partials.assertState(game, 9);

            Partials.verifyRound(game, "in reveal state", {
                col: 0,
                row: 0,
                question: 'Q 1.1.1',
                answer: 'A 1.1.1'
            });
        });
    });

    describe("game starts without any players #NO_PLAYERS", () => {
        const game = Partials.newGame('test/data/test-data-04.json');

        Partials.assertState(game, 0);

        Partials.test(`Host starts game`, () => {
            game.onInput({action: "start"});
        });
        Partials.assertState(game, 0, `state doesn't change when started w/o players`);

        Partials.test(`Game type is not started`, () => {
            const type = game.getUpdate().data.model.round.style;
            assert.strictEqual(type, GAME_MODEL_STYLE.NOT_STARTED);
        });
    });
});