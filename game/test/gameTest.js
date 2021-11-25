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


});

function getPlayerByName(update, name) {
    for (let p of update.data.model.players) {
        if (p.name === name) return p;
    }
    return undefined;
}