import GameModel from "./model/GameModel.js";
import config from "./config.js";
import crypto from "crypto";
import constants from "./constants.js";
import Logger from "@thaerious/logger";

const logger = Logger.getLogger().channel("game");
logger.prefix = ()=>"Game ";

/**
 * Use PlayerValues to record possibly transient values between
 * states.  Each value has an associated player NAME, KEY, and
 * VALUE.
 */
class TransientValues {
    constructor() {
        this.table = {};
    }

    set(name, key, value) {
        if (!this.table[name]) this.table[name] = {};
        this.table[name][key] = value;
    }

    get(name, key, def = undefined) {
        if (!this.table[name]) return def;
        if (!this.table[name][key]) return def;
        return this.table[name][key];
    }

    clear() {
        this.table = {};
    }
}

class Timer {
    constructor(game) {
        this.game = game;
    }

    start(startTime) {
        startTime = parseInt(startTime);
        if (startTime === 0) return;
        this.startTime = startTime;

        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }

        this.currentTime = startTime;
        this.timeout = setTimeout(() => this.update(), 1000);
        this.game.broadcast({
            action: "start_timer",
            data: {time: startTime}
        });
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }
    }

    update() {
        this.currentTime = this.currentTime - 1;
        if (this.currentTime >= 0) {
            this.timeout = setTimeout(() => this.update(), 1000);
            this.onUpdate(this.currentTime);
        } else {
            this.onExpire();
        }
    }

    onUpdate() {
        this.game.broadcast({
            action: "update_timer",
            data: {
                'start-time': this.startTime,
                time: this.currentTime,
                progress: Math.trunc(this.currentTime / this.startTime * 100)
            }
        });
    }

    onExpire() {
        delete this.timeout;
        this.game.onInput({action: "expire"});
    }
}

/**
 * Gets the initial timer values from config.times
 */
class Game {
    /**
     *
     * @param gameModel GameDescriptionModel
     */
    constructor(gameModel) {
        this.timer = new Timer(this);
        this.listeners = {};
        this._state = 0;
        this.transientValues = new TransientValues();
        this.verbose = 0;

        if (gameModel) {
            this.gameModel = gameModel;
            this.updateState(0);
        }

        this.times = {};
        Object.assign(this.times, config.TIMES);
    }

    set state(value) {
        this._state = value;
    }

    get state() {
        return this._state;
    }

    /**
     * @param input {action : string, data : {}}
     */
    onInput(input) {
        logger.log(`#onInput state:${this.state}) input:${JSON.stringify(input)}`);
        logger.log(`-----------------------------------`);

        switch (input.action) {
            case "set_score":
                if (input.player !== config.names.HOST) return;
                const player = this.gameModel.getPlayer(input.data.name);
                player.score = input.data.score;
                this.updateState();
                break;
            case "next_round":
                if (input.player !== config.names.HOST) return;
                this.gameModel.nextRound();
                this.startRound();
                break;
            case "prev_round":
                if (input.player !== config.names.HOST) return;
                this.gameModel.prevRound();
                this.startRound();
                break;
            default:
                this[this.state](input);
                break;
        }
    }

    joinPlayer(name) {
        logger.log(`#joinPlayer(${name})`);
        this.gameModel.addPlayer(name);
        this.updateState();
    }

    updateState(state, extraData = {}) {
        if (state) this.state = state;

        const update = {
            action: "update_model",
            'id-hash': crypto.randomBytes(8).toString('hex'),
            'time-stamp': new Date(),
            data: {
                model: this.gameModel.getUpdate(),
                state: this.state,
                ...extraData
            }
        }

        this.lastUpdate = update;
        this.broadcast(update);
    }

    /**
     * Get the previous update, with new model data.
     * @returns {*}
     */
    getUpdate() {
        const update = {...this.lastUpdate};
        update.data.model = this.gameModel.getUpdate();
        return this.lastUpdate;
    }

    addListener(name, cb) {
        this.listeners[name] = cb;
    }

    removeListener(name) {
        delete this.listeners[name];
    }

    broadcast(msg) {
        msg = msg ?? this.lastUpdate;

        logger.log(`#broadcast`);
        logger.log(JSON.stringify(msg, null, 2));        

        let i = 0;
        for (let name in this.listeners) {
            i = i + 1;
            this.listeners[name](msg);
        }
    }

    notify(name, msg) {
        if (this.listeners[name]) {
            this.listeners[name](msg);
        }
    }

    startRound() {
        if (this.gameModel.getRound().stateData.style === constants.GAME_MODEL_STYLE.JEOPARDY) {
            this.gameModel.getRound().setBoardState();
            this.updateState(4);
        } else if (this.gameModel.getRound().stateData.style === constants.GAME_MODEL_STYLE.END_OF_GAME) {
            this.updateState(10);
        }
    }

    [0](input) {
        switch (input.action) {
            case "start":
                if (this.gameModel.players.length === 0) return;
                this.broadcast({action: "start_game"});
                this.gameModel.setRound(0);
                this.startRound();
                break;
        }
    }

    [4](input) { // waiting for player to pick question
        switch (input.action) {
            case "select":
                let allow = false;
                if (Game.settings.ALLOW_PLAYER_PICK && (this.gameModel.activePlayer.name === input.player)) allow = true;
                if (input.player === config.names.HOST) allow = true;
                if (!allow) return;

                if (!this.gameModel.getRound().isSpent(input.data.col, input.data.row)) {
                    this.gameModel.getRound().setQuestionState(input.data.col, input.data.row);
                    this.gameModel.getRound().setPlayerSpent();
                    this.updateState(5);
                    this.notify(constants.NAMES.HOST, {
                        action: "provide_answer",
                        'id-hash': crypto.randomBytes(8).toString('hex'),
                        'time-stamp': new Date(),
                        data: {
                            answer: this.gameModel.getRound().getAnswer()
                        }
                    });
                    break;
                }
        }
    }

    [5](input) { // waiting for host to read question and click continue
        switch (input.action) {
            case "continue":
                if (input.player !== config.names.HOST) return;
                this.updateState(6);
                this.timer.start(this.times.ANSWER);
                break;
            case "back":
                this.gameModel.getRound().setBoardState();
                this.updateState(4);
                break;
        }
    }

    [6](input) { // timer not expired awaiting answer
        switch (input.action) {
            case "reject":
                this.gameModel.getRound().setPlayerSpent();
                this.gameModel.getRound().clearCurrentPlayer();
                this.timer.stop();
                if (this.gameModel.getRound().countUnspentPlayers() > 0) {
                    this.timer.start(this.times.BUZZ);
                    this.updateState(7);
                } else {
                    this.gameModel.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                let currentPlayer = this.gameModel.getRound().getCurrentPlayer();
                if (!currentPlayer) return;
                this.gameModel.getPlayer(currentPlayer).score += this.gameModel.getRound().getValue();
                this.gameModel.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [7](input) { // waiting for buzzer
        switch (input.action) {
            case "buzz":
                if (this.gameModel.getRound().hasPlayer(input.player)) {
                    this.gameModel.getRound().setCurrentPlayer(input.player);
                    this.gameModel.getRound().setPlayerSpent();
                    this.timer.start(this.times.ANSWER);
                    this.updateState(8);
                }
                break;
            case "expire":
                this.broadcast({action: "stop_timer"});
                this.gameModel.getRound().setRevealState();
                this.updateState(9);
                break;
        }
    }

    [8](input) { // awaiting answer to jeopardy question
        switch (input.action) {
            case "reject":
                let currentPlayer = this.gameModel.getRound().getCurrentPlayer();
                let player = this.gameModel.getPlayer(currentPlayer);
                player.score -= (this.gameModel.getRound().getValue() / 2);
                this.timer.stop();

                this.gameModel.getRound().setPlayerSpent();
                this.gameModel.getRound().clearCurrentPlayer();

                if (this.gameModel.getRound().countUnspentPlayers() > 0) {
                    this.timer.start(this.times.BUZZ);
                    this.updateState(7);
                } else {
                    this.gameModel.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                this.gameModel.getPlayer(this.gameModel.getRound().getCurrentPlayer()).score += this.gameModel.getRound().getValue();
                this.gameModel.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [9](input) { // awaiting answer
        switch (input.action) {
            case "continue":
                this.gameModel.nextActivePlayer();
                this.gameModel.getRound().setBoardState();
                this.updateState(4);
                break;
        }
    }

    [10](input) { // game over
        switch (input.action) {
            /* no accepted inputs */
        }
    }
}

Game.settings = {
    ALLOW_PLAYER_PICK: false
}

export {
    Game, GameModel, Timer, constants
};