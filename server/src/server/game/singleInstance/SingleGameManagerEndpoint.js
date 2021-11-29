// noinspection DuplicatedCode

import SuccessGameHashResponse from "../responses/SuccessGameHashResponse.js";
import InvalidNameResponse from "../responses/InvalidNameResponse.js";
import NameInUseResponse from "../responses/NameInUseResponse.js";
import SuccessResponse from "../responses/SuccessResponse.js";
import RejectedResponse from "../responses/RejectedResponse.js";
import GameManagerEndpoint from "../GameManagerEndpoint.js";

/**
 * API for all non-websocket client-server interaction.
 */
class SingleGameManagerEndpoint extends GameManagerEndpoint{
    /**
     * Create a new GameManagerEndpoint.
     * @param {GameManager} gameManager
     * @param {SessionManager} sessionManager
     */
    constructor(gameManager, validator) {
        super(gameManager, validator, ()=>true);
        const gameHash = this.gameManager.getGameHash(null);
    }

    /**
     * <b>Launch a new game from a game description model.</b>
     * Requires a model (json with game description) and a token (Google auth token),
     * responds with result : success, hash : game-hash.  The game hash is passed to
     * players so they can connect.
     *
     * Ignored in the single instance, always successful.
     *
     * @returns {Promise<void>}
     */
    async ['launch'](req, res) {
        res.json({
            result: "error",
            reason: "method not implemented"
        });
        res.end();
    }

    async ['terminate'](body) {
        this.gameManager.clearAll();
    }

    async ['get-hosted-game-hash'](body, sessionHash) {
        let gameHash = this.gameManager.getGameHash(null);
        if (!this.table[gameHash]) this.table[gameHash] = {host: sessionHash, sessions: {}};
        return new SuccessGameHashResponse(gameHash);
    }

    async ['get-game-hash'](body, sessionHash) {
        const tableEntry = this.knownSessions()[sessionHash];
        if (!tableEntry) return new RejectedResponse("no game associated with session hash");
        return new SuccessGameHashResponse(tableEntry['game-hash']);
    }

    async ['connect-host'](body, sessionHash) {
        return new SuccessGameHashResponse(this.gameManager.getGameHash(null));
    };

    getGameHash(sessionHash){
        return this.gameManager.getGameHash(null);
    }
}

function verifyParameter(req, res, parameter) {
    let value = req.body[parameter];

    if (!value) {
        res.json({
            result : "error",
            reason: `missing parameter: ${parameter}`
        });
        res.end();
        return false;
    }
    return true;
}

export default SingleGameManagerEndpoint;