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

    start(start_time) {
        start_time = parseInt(start_time);
        if (start_time === 0) return;
        this.startTime = start_time;

        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }

        this.current_time = start_time;
        this.timeout = setTimeout(() => this.update(), 1000);
        this.game.broadcast({
            action: "start_timer",
            data: {time: start_time}
        });
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            delete this.timeout;
        }
    }

    update() {
        this.current_time = this.current_time - 1;
        if (this.current_time >= 0) {
            this.timeout = setTimeout(() => this.update(), 1000);
            this.onUpdate(this.current_time);
        } else {
            this.onExpire();
        }
    }

    onUpdate() {
        this.game.broadcast({
            action: "update_timer",
            data: {
                'start-time': this.startTime,
                time: this.current_time,
                progress: Math.trunc(this.current_time / this.startTime * 100)
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
     * @param game_model GameDescriptionModel
     */
    constructor(game_model) {
        this.timer = new Timer(this);
        this.listeners = {};
        this._state = 0;
        this.transientValues = new TransientValues();
        this.verbose = 0;

        if (game_model) {
            this.game_model = game_model;
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

        switch (input.action) {
            case "remove_player":
                if (input.player !== config.names.HOST) return;
                this.game_model.removePlayer(input.data.name);
                this.updateState();
                break;            
            case "set_score":
                if (input.player !== config.names.HOST) return;
                const player = this.game_model.getPlayer(input.data.name);
                player.score = input.data.score;
                this.updateState();
                break;
            case "next_round":
                if (input.player !== config.names.HOST) return;
                this.game_model.nextRound();
                this.startRound();
                break;
            case "prev_round":
                if (input.player !== config.names.HOST) return;
                this.game_model.prevRound();
                this.startRound();
                break;
            default:
                this[this.state](input);
                break;
        }
    }

    joinPlayer(name) {
        logger.log(`#joinPlayer(${name})`);
        this.game_model.addPlayer(name);
        this.updateState();
    }

    updateState(state, extra_data = {}) {
        if (state) this.state = state;

        const update = {
            action: "update_model",
            'id-hash': crypto.randomBytes(8).toString('hex'),
            'time-stamp': new Date(),
            data: {
                model: this.game_model.getUpdate(),
                state: this.state,
                ...extra_data
            }
        }

        this.last_update = update;
        this.broadcast(update);
    }

    /**
     * Get the previous update, with new model data.
     * @returns {*}
     */
    getUpdate() {
        const update = {...this.last_update};
        update.data.model = this.game_model.getUpdate();
        return this.last_update;
    }

    addListener(name, cb) {
        this.listeners[name] = cb;
    }

    removeListener(name) {
        delete this.listeners[name];
    }

    broadcast(msg) {
        msg = msg ?? this.last_update;

        logger.log(`#broadcast`);

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
        if (this.game_model.getRound().stateData.style === constants.GAME_MODEL_STYLE.JEOPARDY) {
            this.game_model.getRound().setBoardState();
            this.updateState(4);
        } else if (this.game_model.getRound().stateData.style === constants.GAME_MODEL_STYLE.END_OF_GAME) {
            this.updateState(10);
        }
    }

    [0](input) {
        switch (input.action) {
            case "start":
                if (this.game_model.players.length === 0) return;
                this.broadcast({action: "start_game"});
                this.game_model.setRound(0);
                this.startRound();
                break;
        }
    }

    [4](input) { // waiting for player to pick question
        switch (input.action) {
            case "select":
                let allow = false;
                if (Game.settings.ALLOW_PLAYER_PICK && (this.game_model.activePlayer.name === input.player)) allow = true;
                if (input.player === config.names.HOST) allow = true;
                if (!allow) return;

                if (!this.game_model.getRound().isSpent(input.data.col, input.data.row)) {
                    this.game_model.getRound().setQuestionState(input.data.col, input.data.row);
                    this.game_model.getRound().setPlayerSpent();
                    this.updateState(5);
                    this.notify(constants.NAMES.HOST, {
                        action: "provide_answer",
                        'id-hash': crypto.randomBytes(8).toString('hex'),
                        'time-stamp': new Date(),
                        data: {
                            answer: this.game_model.getRound().getAnswer()
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
                this.game_model.getRound().setBoardState();
                this.updateState(4);
                break;
        }
    }

    [6](input) { // timer not expired awaiting answer
        switch (input.action) {
            case "reject":
                this.game_model.getRound().setPlayerSpent();
                this.game_model.getRound().clearCurrentPlayer();
                this.timer.stop();
                if (this.game_model.getRound().countUnspentPlayers() > 0) {
                    this.timer.start(this.times.BUZZ);
                    this.updateState(7);
                } else {
                    this.game_model.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                let currentPlayer = this.game_model.getRound().getCurrentPlayer();
                if (!currentPlayer) return;
                this.game_model.getPlayer(currentPlayer).score += this.game_model.getRound().getValue();
                this.game_model.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [7](input) { // waiting for buzzer
        switch (input.action) {
            case "buzz":
                if (this.game_model.getRound().hasPlayer(input.player)) {
                    this.game_model.getRound().setCurrentPlayer(input.player);
                    this.game_model.getRound().setPlayerSpent();
                    this.timer.start(this.times.ANSWER);
                    this.updateState(8);
                }
                break;
            case "expire":
                this.broadcast({action: "stop_timer"});
                this.game_model.getRound().setRevealState();
                this.updateState(9);
                break;
        }
    }

    [8](input) { // awaiting answer to jeopardy question
        switch (input.action) {
            case "reject":
                let current_player = this.game_model.getRound().getCurrentPlayer();
                let player = this.game_model.getPlayer(current_player);
                player.score -= (this.game_model.getRound().getValue() / 2);
                this.timer.stop();

                this.game_model.getRound().setPlayerSpent();
                this.game_model.getRound().clearCurrentPlayer();

                if (this.game_model.getRound().countUnspentPlayers() > 0) {
                    this.timer.start(this.times.BUZZ);
                    this.updateState(7);
                } else {
                    this.game_model.getRound().setRevealState();
                    this.updateState(9);
                }
                break;
            case "expire":
                break;
            case "accept":
                this.game_model.getPlayer(this.game_model.getRound().getCurrentPlayer()).score += this.game_model.getRound().getValue();
                this.game_model.getRound().setRevealState();
                this.timer.stop();
                this.updateState(9);
                break;
        }
    }

    [9](input) { // awaiting answer
        switch (input.action) {
            case "continue":
                this.game_model.nextActivePlayer();
                this.game_model.getRound().setBoardState();
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