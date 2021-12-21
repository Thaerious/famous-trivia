import constants from "../constants.js";
import JeopardyModel from "./JeopardyModel.js";
import EndOfGame from "./EndOfGame.js";
import GameNotStarted from "./GameNotStarted.js";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger().channel("game_model");
logger.prefix = ()=>"GameModel ";

class GameModel {
    constructor(gameDescription) {
        logger.log("#constructor");
        if (typeof gameDescription === "string") gameDescription = JSON.parse(gameDescription);
        this.gameDescription = gameDescription;
        this._players = []; // {name, score, enabled}
        this.listeners = {};
        if (gameDescription) this.setupRounds();
    }

    /**
     * Perform initialization of each round in the model.
     */
    setupRounds(){
        logger.log("#setupRounds");
        this.rounds = [];
        this.roundIndex = -1;

        for(let roundModel of this.gameDescription.rounds){
            if (roundModel.type ===  constants.SCHEMA_CONSTANTS.CATEGORY) {
                this.rounds.push(new JeopardyModel(this, roundModel));
            }
        }

        this.rounds.push(new EndOfGame(this));
    }

    /**
     * Return a new object that is intended to be sent to the client.
     * This object will be used to update the client view.
     * @returns {{round: *}}
     */
    getUpdate(external_update = {}) {
        logger.log("#getUpdate");
        Object.assign(external_update, {players : this.players});
        external_update = JSON.parse(JSON.stringify(external_update));
        return this.getRound().getUpdate(external_update);
    }

    /**
     * Get the current round or the round by index.
     * @param index
     * @returns {*}
     */
    getRound(index) {
        logger.log("#getRound");
        index = index ?? this.roundIndex;
        if (index < 0) return new GameNotStarted();
        return this.rounds[index];
    }

    /**
     * Set the currently active round by index.
     * @param value
     * @return current round object.
     */
    setRound(index) {
        logger.log("#setRound");
        if (index < 0 || index > this.gameDescription.rounds.length) return this.getRound();
        this.roundIndex = index;
        return this.getRound();
    }

    nextRound() {
        logger.log("#nextRound");
        return this.setRound(this.roundIndex + 1);
    }

    prevRound() {
        logger.log("#prevRound");
        return this.setRound(this.roundIndex - 1);
    }

    /**
     * Add a new player to the model
     * If the name already exists, make no change
     * @param name
     * @returns the added player
     */
    addPlayer(name) {
        logger.log("#addPlayer");
        if (this.hasPlayer(name)) {
            return this.getPlayer(name);
        }

        const player = {
            name: name,
            score: 0,
            enabled: true
        };

        this._players.push(player);
        return player;
    }

    disablePlayer(name) {
        logger.log("#disablePlayer");
        if (!this.hasPlayer(name)) return;
        this.getPlayer(name).enabled = false;
    }

    enablePlayer(name) {
        logger.log("#enablePlayer");
        if (!this.hasPlayer(name)) return;
        this.getPlayer(name).enabled = true;
    }

    isEnabled(name) {
        logger.log("#isEnabled");
        if (!this.hasPlayer(name)) return;
        return this.getPlayer(name).enabled;
    }

    /**
     * Get a non-reflective list of players.
     * Each player is an object with:
     * { name, score, enabled}
     * @returns {*[]}
     */
    get players() {
        logger.log(".players");
        return [...this._players];
    }

    /**
     * Retrieve the active player object.
     * @returns {null|*}
     */
    get activePlayer() {
        logger.log(".activePlayer");
        if (this._players.length === 0) return null;
        return this._players[0];
    }

    /**
     * Retrieve a player by name or null.
     * This is reflective, changes are kept.
     * @param name
     * @returns {null|*}
     */
    getPlayer(name) {
        logger.log("#getPlayer");
        for (let player of this._players) if (player.name === name) return player;
        return null;
    }

    hasPlayer(name) {
        logger.log("#hasPlayer");
        return this.getPlayer(name) !== null;
    }

    /**
     * Remove a player specified by 'name' from the game.  If a player with 
     * the same name rejoins, they will be treated as a new player.
     * Returns the player tuple (name, score, enabled) when successfull.
     * Returns null when the player is not found.
     */
    removePlayer(name) {
        logger.log("#removePlayer");
        let player = this.getPlayer(name);
        let index = this._players.indexOf(player);
        if (index === -1) return null;
        let splice = this._players.splice(index, 1);

        if (this.getRound()?.removePlayer) this.getRound().removePlayer(name);

        return splice[0];
    }

    /**
     * Set the current player choosing the question.
     * Setting active player out of range will set it to -1
     * Returns, JSON object to broadcast
     */
    nextActivePlayer() {
        logger.log("#nextActivePlayer");
        if (this._players.length === 0) return null;

        do {
            this._players.push(this._players.shift());
        } while (this._players[0].enabled === false);

        return this._players[0];
    }
}

export default GameModel;
