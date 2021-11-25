// noinspection DuplicatedCode
import assert from 'assert';
import * as Partials from "./partials/game_partials.js"
import {GAME_MODEL_STYLE, GAME_MODEL_STATES} from "../src/constants.js";

function playerUpdateIndex(game, player, index) {
    describe('player update index', function () {
        it(`${player} updates answer to ${index}`, () => {
            game.onInput({player: player, action: "update_index", data: {index: index}});
        });
    });
}

function playerUpdateBet(game, player, bet) {
    describe('player update bet', function () {
        it(`${player} updates answer to ${bet}`, () => {
            game.onInput({player: player, action: "update_bet", data: {bet: bet}});
        });
    });
}

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

        Partials.assertState(game, 1);

        describe(`check update values`, () => {
            it(`Game type is multiple choice`, () => {
                const type = game.getUpdate().data.model.round.style
                assert.strictEqual(type, GAME_MODEL_STYLE.MULTIPLE_CHOICE);
            });

            it(`Question matches the data file`, () => {
                const question = game.getUpdate().data.model.round.question
                assert.strictEqual(question, "MCQ");
            });

            it(`Answer options are not visible`, () => {
                const answers = game.getUpdate().data.model.round.answers
                assert.strictEqual(answers, undefined);
            });

            it(`Correct answer is not visible`, () => {
                const correct = game.getUpdate().data.model.round['correct-answer'];
                assert.strictEqual(correct, undefined);
            });
        });
    });

    return game;
}

function waitForAnswers(game) {
    describe("Transition from showing question to waiting for answers", ()=> {
        it(`Host continues`, ()=> {game.onInput({action: "continue"});});
        Partials.assertState(game, 2);

        it(`Question matches the data file`, ()=> {
            const question = game.getUpdate().data.model.round.question
            assert.strictEqual(question, "MCQ");
        });

        it(`Answer options are visible`, ()=> {
            const answers = game.getUpdate().data.model.round.answers
            assert.notStrictEqual(answers, undefined);
        });

        it(`Correct answer is not visible`, ()=> {
            const question = game.getUpdate().data.model.round['correct-answer'];
            assert.strictEqual(question, undefined);
        });

        it(`Verify answers match`, ()=> {
            const answers = game.getUpdate().data.model.round.answers
            assert.strictEqual(answers[0], "MCA1");
            assert.strictEqual(answers[1], "MCA2");
            assert.strictEqual(answers[2], "MCA3");
            assert.strictEqual(answers[3], "MCA4");
            assert.strictEqual(answers[4], "MCA5");
        });
    });
}

function revealAnswer(game, correct_answer = 2) {
    describe("Transition from waiting for answers to revealing correct answer", ()=> {
        it(`Host continues`, ()=> {game.onInput({action: "expire"});});
        Partials.assertState(game, 3);

        it(`Question matches the data file`, ()=> {
            const question = game.getUpdate().data.model.round.question
            assert.strictEqual(question, "MCQ");
        });

        it(`Answer options are visible`, ()=> {
            const answers = game.getUpdate().data.model.round.answers
            assert.notStrictEqual(answers, undefined);
        });

        it(`Correct answer is visible`, ()=> {
            const correct = game.getUpdate().data.model.round['correct-answer'];
            assert.notStrictEqual(correct, undefined);
        });

        it(`Verify answers match`, ()=> {
            const answers = game.getUpdate().data.model.round.answers
            assert.strictEqual(answers[0], "MCA1");
            assert.strictEqual(answers[1], "MCA2");
            assert.strictEqual(answers[2], "MCA3");
            assert.strictEqual(answers[3], "MCA4");
            assert.strictEqual(answers[4], "MCA5");
        });

        it(`Verify correct answer`, ()=> {
            const correct = game.getUpdate().data.model.round['correct-answer'];
            assert.strictEqual(correct, correct_answer);
        });
    });
}

describe(`Test multiple-choice only game`, () => {

    describe("All players pass in 1 index and 1 bet, 1 player correct", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 100);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 100);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 0);
        playerUpdateIndex(game, "Barkley", 1);
        playerUpdateIndex(game, "Chuck", 2);
        playerUpdateIndex(game, "Davidson", 3);
        playerUpdateBet(game, "Adam", 100);
        playerUpdateBet(game, "Barkley", 100);
        playerUpdateBet(game, "Chuck", 100);
        playerUpdateBet(game, "Davidson", 100);
        revealAnswer(game);
        Partials.verifyScores(game, {
           "Adam"     : 0,
           "Barkley"  : 0,
           "Chuck"    : 200,
           "Davidson" : 0
        });
    });

    describe("All players pass in 1 index and 1 bet, 3 players correct", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 100);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 2);
        playerUpdateIndex(game, "Barkley", 2);
        playerUpdateIndex(game, "Chuck", 2);
        playerUpdateIndex(game, "Davidson", 3);
        playerUpdateBet(game, "Adam", 100);
        playerUpdateBet(game, "Barkley", 100);
        playerUpdateBet(game, "Chuck", 100);
        playerUpdateBet(game, "Davidson", 100);
        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 300,
            "Barkley"  : 200,
            "Chuck"    : 200,
            "Davidson" : 0
        });
    });

    describe("All players pass in multiple inputs, 2 players correct", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 100);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);

        playerUpdateIndex(game, "Adam", 3);
        playerUpdateIndex(game, "Barkley", 3);
        playerUpdateIndex(game, "Adam", 2);
        playerUpdateIndex(game, "Barkley", 2);
        playerUpdateBet(game, "Adam", 100);
        playerUpdateBet(game, "Barkley", 100);
        playerUpdateBet(game, "Chuck", 100);
        playerUpdateBet(game, "Davidson", 100);
        playerUpdateIndex(game, "Chuck", 2);
        playerUpdateIndex(game, "Davidson", 3);
        playerUpdateIndex(game, "Adam", 1);

        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 100,
            "Barkley"  : 200,
            "Chuck"    : 200,
            "Davidson" : 0
        });
    });

    describe("All players pass in 1 index and 1 bet, 0 players correct", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 300);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 0);
        playerUpdateIndex(game, "Barkley", 1);
        playerUpdateIndex(game, "Chuck", 3);
        playerUpdateIndex(game, "Davidson", 3);
        playerUpdateBet(game, "Adam", 100);
        playerUpdateBet(game, "Barkley", 0);
        playerUpdateBet(game, "Chuck", 100);
        playerUpdateBet(game, "Davidson", 100);
        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 100,
            "Barkley"  : 100,
            "Chuck"    : 200,
            "Davidson" : 0
        });
    });

    describe("Players over-bet, only takes what players have when wrong", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 300);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 0);
        playerUpdateIndex(game, "Barkley", 1);
        playerUpdateIndex(game, "Chuck", 3);
        playerUpdateIndex(game, "Davidson", 3);
        playerUpdateBet(game, "Adam", 300);
        playerUpdateBet(game, "Barkley", 200);
        playerUpdateBet(game, "Chuck", 500);
        playerUpdateBet(game, "Davidson", 1000);
        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 0,
            "Barkley"  : 0,
            "Chuck"    : 0,
            "Davidson" : 0
        });
    });

    describe("Players over-bet, only takes what players have when correct", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 300);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 2);
        playerUpdateIndex(game, "Barkley", 2);
        playerUpdateIndex(game, "Chuck", 2);
        playerUpdateIndex(game, "Davidson", 2);
        playerUpdateBet(game, "Adam", 300);
        playerUpdateBet(game, "Barkley", 200);
        playerUpdateBet(game, "Chuck", 500);
        playerUpdateBet(game, "Davidson", 1000);
        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 400,
            "Barkley"  : 200,
            "Chuck"    : 600,
            "Davidson" : 200
        });
    });

    describe("Some players provide no input (default is index 0)", ()=> {
        const game = situationSetup('test/data/test-data-02.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 100);
        Partials.hackPlayerScore(game, "Chuck", 300);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 2);
        playerUpdateIndex(game, "Davidson", 2);
        playerUpdateBet(game, "Adam", 200);
        playerUpdateBet(game, "Davidson", 100);
        revealAnswer(game);
        Partials.verifyScores(game, {
            "Adam"     : 400,
            "Barkley"  : 100,
            "Chuck"    : 300,
            "Davidson" : 200
        });
    });

    describe("Some players provide no index (default is index 0) default to correct", ()=> {
        const game = situationSetup('test/data/test-data-03.json');

        Partials.hackPlayerScore(game, "Adam", 200);
        Partials.hackPlayerScore(game, "Barkley", 200);
        Partials.hackPlayerScore(game, "Chuck", 200);
        Partials.hackPlayerScore(game, "Davidson", 100);
        waitForAnswers(game);
        playerUpdateIndex(game, "Adam", 2);
        playerUpdateIndex(game, "Davidson", 2);
        playerUpdateBet(game, "Adam", 200);
        playerUpdateBet(game, "Barkley", 200);
        playerUpdateBet(game, "Chuck", 200);
        playerUpdateBet(game, "Davidson", 100);
        revealAnswer(game, 0);
        Partials.verifyScores(game, {
            "Adam"     : 0,
            "Barkley"  : 400,
            "Chuck"    : 400,
            "Davidson" : 0
        });
    });
});

// describe("POST", ()=>{
//     it("", ()=> {
//         console.log(JSON.stringify(game.getUpdate().data.model, null, 2));
//     });
// });