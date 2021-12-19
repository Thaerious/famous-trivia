// noinspection SqlNoDataSourceInspection,SqlDialectInspection

import crypto from 'crypto';
import config from "../config.js";

/**
 * The game manager keeps a record of all launched games.
 *
 *
 */
class GameManager{
    constructor() {
        this.hosts = new Map(); // userId -> {hash, name}
        this.liveGames= new Map(); // hash -> game
    }

    get size(){
        return this.liveGames.size;
    }

    set timeAnswer(value){
        this.ta = value;
    }

    set timeBuzz(value){
        this.tb = value;
    }

    set timeMultipleChoice(value){
        this.tm = value;
    }

    /**
     * Associate a host with a game.
     * Generates a hash value to recall the game with.
     * @param hostInfo the user object returned from verify.js
     * @param game a game object from Game.js
     * @returns {string} the game-hash of the live game
     */
    setGame(hostInfo, liveGame) {
        if (!hostInfo?.userId) throw new Error("userId missing from user object");
        if (!hostInfo?.userName) throw new Error("userName missing from user object");
        if (this.hosts.has(hostInfo.userId)) throw new Error("duplicate host key");

        let gameHash = crypto.randomBytes(20).toString('hex');
        this.liveGames.set(gameHash, liveGame);

        liveGame.times.ANSWER          = this.ta ?? config.TIMES.ANSWER;
        liveGame.times.BUZZ            = this.tb ?? config.TIMES.BUZZ;

        this.hosts.set(hostInfo.userId, {hash:gameHash, name:hostInfo.userName});
        return gameHash;
    }

    /**
     * True if the game has been saved for the given host.
     * @param hostInfo the user object returned from verify.js
     */
    hasGame(hostInfo) {
        return this.hosts.has(hostInfo.userId);
    }

    /**
     * Retrieve a game based on the host.
     * @param hostToken the user object returned from verify.js
     * @returns {Promise<unknown>}
     */
    getGame(hostInfo) {
        const tableEntry = this.hosts.get(hostInfo.userId);
        if (!tableEntry) throw new Error("no game associated with host");
        return this.liveGames.get(tableEntry.hash);
    }

    /**
     * Remove a hosted game from the db.
     * @param hostInfo the user object returned from verify.js
     * @returns {boolean}
     */
    deleteGame(hostInfo) {
        if (!this.hosts.get(hostInfo.userId)) return false;
        const hash = this.hosts.get(hostInfo.userId).hash;
        this.liveGames.delete(hash);
        this.hosts.delete(hostInfo.userId);
        return true;
    }

    /**
     * Retrieve the public hash for a game.
     * @param hostToken the user object returned from verify.js
     * @returns {Promise<unknown>}
     */
    getGameHash(hostInfo) {
        return this.hosts.get(hostInfo.userId)?.hash;
    }

    /**
     * Return the live game object.
     * @param gameHash The public hash for a game.
     * @return The live game object or undefined if no game found.
     */
    getLiveGame(gameHash){
        return this.liveGames.get(gameHash);
    }
}

export default GameManager;