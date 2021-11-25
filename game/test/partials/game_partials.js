import assert from "assert";
import fs from "fs";
import GameModel from "../../src/model/GameModel.js";
import {Game} from "../../src/Game.js";

function newGame(path = 'test/data/test-data-02.json'){
    const file = fs.readFileSync(path);
    const data = JSON.parse(file);

    let gameModel = new GameModel(data);
    let game = new Game(gameModel);

    game.times = {
        ANSWER: 0,
        BUZZ: 0,
        MULTIPLE_CHOICE: 0
    }
    return game;
}

function getPlayerByName(update, name){
    for (let p of update.data.model.players){
        if (p.name === name) return p;
    }
    return undefined;
}

function playerJoinsGame(game, name) {
    describe(`player ${name} joins game`, ()=> {
        it(`${name} joins game`, () => {
            game.joinPlayer(name);
        });

        it(`Game update->data->model->players contains ${name}`, () => {
            assert.notStrictEqual(getPlayerByName(game.getUpdate(), name), undefined);
        });
    });
}

function assertState(game, state, desc) {
    if (!desc) desc = `assert state`

    describe(desc, ()=> {
        it(`update->data->state is ${state}`, () => {
            assert.strictEqual(game.getUpdate().data.state, state);
        });
    });
}

function hackPlayerScore(game, name, score) {
    describe('hack player score', function () {
        it(`host sets score for ${name} to ${score}`, () => {
            game.onInput({player: "@HOST", action: "set_score", data: {name: name, score: score}});
        });

        it(`verify score`, () => {
            assert.strictEqual(getPlayerByName(game.getUpdate(), name).score, score);
        });
    });
}

function verifyScores(game, scores) {
    describe("verify scores", ()=> {
        for (let name in scores) {
            it(`score for ${name} is ${scores[name]}`, ()=> {
                const player = getPlayerByName(game.getUpdate(), name);
                const actual = player.score;
                assert.strictEqual(actual, scores[name]);
            });
        }
    });
}

function verifyRound(game, desc, round) {
    if (!round) {
        round = desc;
        desc = "verify fields in update->model->round";
    }

    describe(desc, ()=> {
        for (let parameter in round) {
            it(`update->model->round->${parameter} is ${round[parameter]}`, ()=> {
                const expected = round[parameter];
                const actual = game.getUpdate().data.model.round[parameter];
                assert.deepStrictEqual(actual, expected);
            });
        };
    });
}

function test(desc, fn) {
    describe(desc, ()=> {
        it("verify", fn);
    });
}

/**
 * Assert that all fields in expected are equal to any paired field in actual
 * @param actual
 * @param expected
 */
function assertFields(actual, expected) {
    for (let parameter in expected) {
        const exp = expected[parameter];
        const acp = actual[parameter];
        assert.deepStrictEqual(acp, exp);
    };
}

export {
    newGame,
    getPlayerByName,
    playerJoinsGame,
    assertState,
    hackPlayerScore,
    verifyScores,
    test,
    verifyRound,
    assertFields
};