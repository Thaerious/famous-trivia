// gameTest.js
// noinspection DuplicatedCode

import assert from 'assert';
import fs from 'fs';
import GameModel from '../src/model/GameModel.js';
import {Game, Timer} from '../src/Game.js';
import {GAME_MODEL_STYLE, GAME_MODEL_STATES} from "../src/constants.js";

const file = fs.readFileSync('test/data/test-data-00.json');
const data = JSON.parse(file);

Game.settings.ALLOW_PLAYER_PICK = true;

function newGame() {
    let gameModel = new GameModel(data);
    let game = new Game(gameModel);

    game.times = {
        ANSWER: 1,
        BUZZ: 1,
        MULTIPLE_CHOICE: 1
    }
    return game;
}

describe(`gameTest.js`, () => {
    describe(`Player joins game before it has started, host selects question, it's accepted`, () => {
        let game = newGame();

        it(`Adam joins game`, () => {
            game.joinPlayer("Adam");
            assert.strictEqual(game.gameModel.hasPlayer("Adam"), true);
        });

        it(`Host starts game`, () => {
            game.onInput({action: "start"});
            assert.strictEqual(game.getUpdate().data.state, 4);
        });

        it(`Adam is the current player`, () => {
            assert.strictEqual(game.getUpdate().data.model.round.current_player, "Adam");
        });

        it(`Host selects question`, () => {
            game.onInput({action: "select", data: {col: 0, row: 0}, player: "@HOST"});
            assert.strictEqual(game.getUpdate().data.state, 5);
        });

        it(`Host presses continue`, () => {
            game.onInput({action: "continue", player: "@HOST"});
            assert.strictEqual(game.getUpdate().data.state, 6);
        });

        it(`Host accepts answer`, () => {
            game.onInput({action: "accept", player: "@HOST"});
            assert.strictEqual(game.getUpdate().data.state, 9);
        });
    });

    describe(`Host can't start game until player has joined`, () => {
        describe('situation setup', function () {
            let game = newGame();

            it(`Host starts game`, () => {
                game.onInput({action: "start"});
                assert.strictEqual(game.getUpdate().data.state, 0);
            });

            it(`Adam joins game`, () => {
                game.joinPlayer("Adam");
            });

            it(`Host starts game again`, () => {
                game.onInput({action: "start"});
                assert.strictEqual(game.getUpdate().data.state, 4);
            });

            it(`Adam is the current player`, () => {
                assert.strictEqual(game.getUpdate().data.model.round.current_player, "Adam");
            });

            it(`Host selects question`, () => {
                game.onInput({action: "select", data: {col: 0, row: 0}, player: "@HOST"});
                assert.strictEqual(game.getUpdate().data.state, 5);
            });

            it(`Host presses continue`, () => {
                game.onInput({action: "continue", player: "@HOST"});
                assert.strictEqual(game.getUpdate().data.state, 6);
            });

            it(`Host accepts answer`, () => {
                game.onInput({action: "accept", player: "@HOST"});
                assert.strictEqual(game.getUpdate().data.state, 9);
            });
        });
    });

    describe(`One player in state 6 (picked a question), answer rejected`, () => {
        describe('situation setup', function () {
            let game = newGame();
            game.joinPlayer("Adam");
            game.onInput({action: "start"});
            game.onInput({action: "select", data: {col: 0, row: 1}, player: "@HOST"});
            game.onInput({action: "continue", player: "@HOST"});
            game.onInput({action: "reject", player: "@HOST"});

            it(`State changes to 9 - waiting for host to continue`, () => {
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 9);
            });
        });
    });

    describe(`Game Mock-Up`, () => {
        let game = newGame();

        describe('#constructor()', function () {
            it('constructor sanity test', function () {
                assert.notStrictEqual(game, null);
            });
        });

        describe('Add 3 players to game', function () {
            game.joinPlayer("Adam");
            game.joinPlayer("Beth");
            game.joinPlayer("Charles");

            it('has 3 players', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players.length, 3);
            });
        });

        describe('Start the game', function () {
            game.onInput({action: "start"});
            let update = game.getUpdate().data;

            it('The game starts in state 4 - jeopardy select question', function () {
                assert.strictEqual(update.state, 4);
            });
            it(`Loads correct (jeopardy) round. update->model->round->style is ${GAME_MODEL_STYLE.JEOPARDY}`, function () {
                let update = game.getUpdate().data;
                console.log(update);
                assert.strictEqual(update.model.round.style, GAME_MODEL_STYLE.JEOPARDY);
            });
            it('No questions are blanked', function () {
                let update = game.getUpdate().data;
                update.model.round.spent.forEach(c => c.forEach(r => assert.strictEqual(r, false)));
            });
            it(`The first player 'Adam' is the current player for the round`, function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.current_player, "Adam");
            });
        });

        describe('Host selects question (first cat, $200)', function () {
            it('Host gets the answer when a question is selected', done => {
                game.addListener("@HOST", msg => {
                    if (msg.action === 'provide_answer') {
                        assert.strictEqual(msg.data.answer, "A 1.2");
                        game.removeListener("@HOST");
                        done();
                    }
                });
                game.onInput({action: "select", data: {col: 0, row: 1}, player: "@HOST"});
            });

            it('State changes to 5 - Waiting for host to press continue', () => {
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 5);
            });

            it('loads correct (jeop) round', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.style, GAME_MODEL_STYLE.JEOPARDY);
            });
            it('column set to 0', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.col, 0);
            });
            it('row set to 1', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.row, 1);
            });
            it('type is text', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.type, "text");
            });
            it('question is Q 1.2', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.question, "Q 1.2");
            });
            it('answer text not provided', function () {
                game.onInput({action: "accept"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.answer, undefined);
            });
        });

        describe('Host presses continue to start answer timer (1)', function () {
            it('state changes', function () {
                game.onInput({action: "continue", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 6);
            });
            it('answer text not provided', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.answer, undefined);
            });
        });

        describe('Host accepts answer before timer expires', function () {
            it('state changes to 9 - waiting for host to press continue', function () {
                game.onInput({action: "accept"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 9);
            });
            it('Score for current player (index 0) increases by 200', function () {
                game.onInput({action: "accept"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players[0].score, 200);
            });
            it('Answer text provided in update', function () {
                game.onInput({action: "accept"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.answer, "A 1.2");
            });
        });

        describe('Host presses continue to advance to next player (1)', function () {
            it('state changes to 4 - jeopardy select question', function () {
                game.onInput({action: "continue", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
            it('loads correct (jeop) round', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.style, GAME_MODEL_STYLE.JEOPARDY);
            });
            it('one option spent', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.spent[0][1], true);
            });
            it('active player order updates', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players[0].name, "Beth");
                assert.strictEqual(update.model.players[1].name, "Charles");
                assert.strictEqual(update.model.players[2].name, "Adam");
            });
            it('current player is \'active player\'', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.current_player, "Beth");
            });
        });

        describe('Select previously selected question (first cat, $200)', function () {
            it('state does not change', function () {
                game.onInput({action: "select", data: {col: 0, row: 1}});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
            it('current player does not change', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.current_player, "Beth");
            });
        });

        describe('Host selects question (first cat, $400)', function () {
            it('state changes', function () {
                game.onInput({action: "select", data: {col: 0, row: 3}, player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 5);
            });
            it('loads correct (jeop) round', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.style, GAME_MODEL_STYLE.JEOPARDY);
            });
            it('column set to 0', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.col, 0);
            });
            it('row set to 3', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.row, 3);
            });
            it('type is text', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.type, "text");
            });
            it('question is Q 1.4', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.question, "Q 1.4");
            });
            it('answer text not provided', function () {
                game.onInput({action: "accept"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.answer, undefined);
            });
        });

        describe('Host clicks continue (goes to state 6) then timer expires', function () {
            it('state does not change (stays in 6)', function (done) {
                this.timeout(5000);
                game.addListener("test", msg => {
                    if (msg.action === 'update_model') {
                        assert.strictEqual(msg.data.state, 6);
                        game.removeListener("test");
                        done();
                    }
                });

                game.onInput({action: "continue", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 6);
            });
        });

        describe('host rejects answer after timer expires', function () {
            it('state changes', function () {
                game.onInput({action: "reject"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 7);
            });
            it('clear current player (waiting for a player to buzz in)', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.current_player, '');
            });
        });

        describe(`Player (Beth) buzzes in (shouldn't be able to)`, function () {
            describe('player has already answered', function () {
                it('no state change', function () {
                    game.onInput({action: "buzz", player: "Beth"});
                    let update = game.getUpdate().data;
                    assert.strictEqual(update.state, 7);
                });
            });
            describe('player has not already answered', function () {
                it('Charles buzzes in', function () {
                    game.onInput({action: "buzz", player: "Charles"});
                    let update = game.getUpdate().data;
                    assert.strictEqual(update.state, 8);
                });
                it('the current player is updated to Charles', function () {
                    let update = game.getUpdate().data;
                    assert.strictEqual(update.model.round.current_player, "Charles");
                });
            });
        });

        describe('answer rejected (not active player)', function () {
            it('state changes', function () {
                game.onInput({action: "reject"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 7);
            });
            it(`score decreases because it's not the original player`, function () {
                let update = game.getUpdate().data;
                let score = update.model.players.find(p => p.name === 'Charles').score;
                assert.strictEqual(score, -200);
            });
        });

        describe('timer expires no buzz in', function () {
            it('state changes', function (done) {
                this.timeout(5000);
                game.addListener("test", msg => {
                    if (msg.action === 'update_model') {
                        assert.strictEqual(msg.data.state, 9);
                        game.removeListener("test");
                        done();
                    }
                });
            });
        });

        describe('host continues', function () {
            it('state changes', () => {
                game.onInput({action: "continue", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
        });

        describe('Wrong player selects question (not allowed)', function () {
            it(`state doesn't change`, function () {
                game.onInput({action: "select", data: {col: 0, row: 4}, player: "Adam"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
        });

        describe('Player selects question (Charlie), question already picked (not allowed)', function () {
            it(`state doesn't change`, function () {
                game.onInput({action: "select", data: {col: 0, row: 3}, player: "Charlie"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
        });

        describe('Player selects question (Charlie), host goes back', function () {
            it(`state changes`, function () {
                let u = game.getUpdate().data;
                game.onInput({action: "select", data: {col: 0, row: 4}, player: "Charles"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 5);
            });
            it(`host selects back`, function () {
                game.onInput({action: "back", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 4);
            });
        });

        describe(`Player joins (state 4) while waiting for question pick`, function () {
            it(`player joins`, function () {
                game.joinPlayer("Dave");
                let update = game.getUpdate().data;
            });

            it('has 4 players', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players.length, 4);
            });

            it('only the current player is spent', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players.length, 4);
            });

            it('new player is last player', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players[update.model.players.length - 1].name, "Dave");
            });
        });

        describe(`Player joins with same name (not changes made to game)`, function () {
            it(`player joins`, function () {
                game.joinPlayer("Dave");
                let update = game.getUpdate().data;
            });

            it('has 4 players', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players.length, 4);
            });

            it('only the current player is spent', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players.length, 4);
            });

            it('new player is last player', function () {
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.players[update.model.players.length - 1].name, "Dave");
            });
        });

        describe(`Player chooses question, timer expires`, function () {
            describe(`Player chooses question`, function () {
                it(`state changes to 5`, () => {
                    game.onInput({action: "select", data: {col: 1, row: 4}, player: "Charles"});
                    assert.strictEqual(game.getUpdate().data.state, 5);
                });
            });

            describe(`Host presses continue`, function () {
                it(`state changes to 6`, () => {
                    game.onInput({action: "continue", player: "@HOST"});
                    assert.strictEqual(game.getUpdate().data.state, 6);
                });
            });

            describe(`Timer expires`, function () {
                it(`state stays at 6`, () => {
                    game.onInput({action: "expire"});
                    assert.strictEqual(game.getUpdate().data.state, 6);
                });
            });

            describe(`Host rejects, another player buzzes in and expires, then host rejects again`, function () {
                it(`host rejects, state changes to 7`, () => {
                    game.onInput({action: "reject", player: "@HOST"});
                    assert.strictEqual(game.getUpdate().data.state, 7);
                });
                it(`player buzzes in, state becomes 8`, () => {
                    game.onInput({action: "buzz", player: "Adam"});
                    assert.strictEqual(game.getUpdate().data.state, 8);
                });
                it(`timer expires, state remains in 8 awaiting host's judgment`, () => {
                    game.onInput({action: "expire"});
                    assert.strictEqual(game.getUpdate().data.state, 8);
                });
                it(`host rejects, state becomes 7`, () => {
                    game.onInput({action: "reject", player: "@HOST"});
                    assert.strictEqual(game.getUpdate().data.state, 7);
                });
                it(`Adam has 500 less points (200 - 500 = -300)`, () => {
                    const player = getPlayerByName(game.getUpdate(), "Adam");
                    assert.notStrictEqual(player.score, -300);
                });
            });
        });

        describe(`Remaining players buzz in and get rejected`, function () {
            it(`State becomes 9 - show answer & wait for continue`, () => {
                game.onInput({action: "buzz", player: "Beth"});
                game.onInput({action: "expire"});
                game.onInput({action: "reject", player: "@HOST"});

                game.onInput({action: "buzz", player: "Dave"});
                game.onInput({action: "expire"});
                game.onInput({action: "reject", player: "@HOST"});

                assert.strictEqual(game.getUpdate().data.state, 9);
            });
        });

        describe(`Player buzzes in and gets answer correct`, function () {
            it('situation setup', function () {
                game.onInput({action: "continue", player: "@HOST"});
                game.onInput({action: "select", data: {col: 3, row: 0}, player: "@HOST"});
                game.onInput({action: "continue", player: "@HOST"});
                game.onInput({action: "reject", player: "@HOST"});

                game.onInput({action: "buzz", player: "Dave"});
                game.onInput({action: "accept", player: "@HOST"});
            });

            it(`State changes to 9 - waiting for host to continue`, () => {
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 9);
            });

            it(`Dave's score increases by 100`, () => {
                const scoreAfter = getPlayerByName(game.getUpdate(), "Dave").score;
                assert.strictEqual(scoreAfter, -150);
            });
        });

        describe('start next round', function () {
            it(`doesn't work if it doesn't come from the host`, function () {
                game.onInput({action: "next_round", player: "Dave"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 9);
            });

            it(`changes the state (in this case to 1)`, function () {
                game.onInput({action: "next_round", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 1);
            });

            it('loads correct (mc) round', function () {
                game.onInput({action: "start"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.style, GAME_MODEL_STYLE.MULTIPLE_CHOICE);
            });
            it('multiple choice starts in question state', function () {
                game.onInput({action: "start"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.state, GAME_MODEL_STATES.QUESTION);
            });
            it('has correct question from file', function () {
                game.onInput({action: "start"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.model.round.question, "MCQ");
            });
        });

        describe('host clicks continue', function () {
            it('changes state', function () {
                game.onInput({action: "continue", player: "@HOST"});
                let update = game.getUpdate().data;
                assert.strictEqual(update.state, 2);
            });
        });
    });
});

function getPlayerByName(update, name) {
    for (let p of update.data.model.players) {
        if (p.name === name) return p;
    }
    return undefined;
}