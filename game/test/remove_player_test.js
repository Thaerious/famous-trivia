import assert from "assert";
import fs from "fs";
import GameModel from "../src/model/GameModel.js";
import { Game, Timer } from "../src/Game.js";
import { isTypedArray } from "util/types";

function newGame(filename = "test/data/test-data-00.json") {
    const file = fs.readFileSync(filename);
    const data = JSON.parse(file);
    const gameModel = new GameModel(data);
    const game = new Game(gameModel);

    game.times = {
        ANSWER: 1,
        BUZZ: 1,
        MULTIPLE_CHOICE: 1,
    };
    return game;
}

describe(`remove_player_test.js`, function () {
    describe(`simple add player then remove them`, function () {
        before(function () {
            this.game = newGame();
        });

        describe(`players join the game`, function () {
            describe(`#hasPlayer`, function () {
                it(`true for Adam`, function () {
                    this.game.joinPlayer("Adam");
                    assert.strictEqual(this.game.game_model.hasPlayer("Adam"), true);
                });
                it(`true for Beth`, function () {
                    this.game.joinPlayer("Beth");
                    assert.strictEqual(this.game.game_model.hasPlayer("Beth"), true);
                });
                it(`true for Charlie`, function () {
                    this.game.joinPlayer("Charlie");
                    assert.strictEqual(this.game.game_model.hasPlayer("Charlie"), true);
                });
                it(`true for Dave`, function () {
                    this.game.joinPlayer("Dave");
                    assert.strictEqual(this.game.game_model.hasPlayer("Dave"), true);
                });
            });
        });

        describe(`Adam is removed from the game`, function () {
            before(function () {
                this.game.game_model.removePlayer("Adam");
            });

            describe(`#hasPlayer`, function () {
                it(`false for Adam`, function () {
                    assert.strictEqual(this.game.game_model.hasPlayer("Adam"), false);
                });
                it(`true for Beth`, function () {
                    assert.strictEqual(this.game.game_model.hasPlayer("Beth"), true);
                });
                it(`true for Charlie`, function () {
                    assert.strictEqual(this.game.game_model.hasPlayer("Charlie"), true);
                });
                it(`true for Dave`, function () {
                    assert.strictEqual(this.game.game_model.hasPlayer("Dave"), true);
                });
            });
        });
    });

    describe(`removed player is current player`, function () {
        beforeEach(function () {
            this.game = newGame();
            this.game.joinPlayer("Adam");
            this.game.joinPlayer("Beth");
            this.game.joinPlayer("Charlie");
            this.game.joinPlayer("Dave");
            this.game.onInput({action: "start"});
        });

        describe(`player drops out while choosing question`, function(){
            beforeEach(function(){
                this.game.game_model.removePlayer("Adam");
            });

            it(`the second player (Beth) becomes the current player`, function(){
                const data = this.game.getUpdate().data;
                const expected = "Beth";
                const actual = data.model.round.current_player;
                assert.strictEqual(actual, expected);
            });
        });

        describe(`player drops out after choosing question before answering`, function(){
            beforeEach(function(){
                this.game.onInput({action: "select", data: {col: 0, row: 1}, player: "@HOST"});
                this.game.game_model.removePlayer("Adam");
            });

            it(`current player becomes blank`, function(){
                const data = this.game.getUpdate().data;
                const expected = "";
                const actual = data.model.round.current_player;
                assert.strictEqual(actual, expected);
            });
        });        
            
    });
});
