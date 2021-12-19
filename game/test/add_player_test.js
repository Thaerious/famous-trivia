import assert from "assert";
import fs from "fs";
import GameModel from "../src/model/GameModel.js";
import { Game, Timer } from "../src/Game.js";
import Logger from "@thaerious/logger";

Logger.getLogger().channel("game").enabled = false;
Logger.getLogger().channel("game_model").enabled = false;

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

describe(`add_player_test.js`, function () {
    describe(`players join the game`, function () {          
        describe(`gameModel #hasPlayer`, function () {
            before(function () {
                this.game = newGame();
            });   

            it(`true for Adam`, function () {
                this.game.joinPlayer("Adam");
                assert.strictEqual(this.game.gameModel.hasPlayer("Adam"), true);
            });
            it(`true for Beth`, function () {
                this.game.joinPlayer("Beth");
                assert.strictEqual(this.game.gameModel.hasPlayer("Beth"), true);
            });
            it(`true for Charlie`, function () {
                this.game.joinPlayer("Charlie");
                assert.strictEqual(this.game.gameModel.hasPlayer("Charlie"), true);
            });
            it(`true for Dave`, function () {
                this.game.joinPlayer("Dave");
                assert.strictEqual(this.game.gameModel.hasPlayer("Dave"), true);
            });
        });
        describe(`update has player`, function () {
            before(function () {
                this.game = newGame();
            });   

            it(`true for Adam`, function () {
                this.game.joinPlayer("Adam");
                const update = this.game.gameModel.getUpdate();
                assert.strictEqual(update.players[0].name, "Adam");
            });
            it(`true for Beth`, function () {
                this.game.joinPlayer("Beth");
                const update = this.game.gameModel.getUpdate();
                assert.strictEqual(update.players[1].name, "Beth");
            });
            it(`true for Charlie`, function () {
                this.game.joinPlayer("Charlie");
                const update = this.game.gameModel.getUpdate();
                assert.strictEqual(update.players[2].name, "Charlie");
            });
            it(`true for Dave`, function () {
                this.game.joinPlayer("Dave");
                const update = this.game.gameModel.getUpdate();
                assert.strictEqual(update.players[3].name, "Dave");
            });
        });        
    });
});
