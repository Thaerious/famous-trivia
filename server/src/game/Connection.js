import ErrorResponse from "./responses/ErrorResponse.js";
import Logger from "@thaerious/logger";
import config from "../config.js";
const logger = Logger.getLogger().channel("connection");
logger.prefix = ()=>"Connection ";
/**
 * All incoming messages to the server should take the form of
 * {
 *     action : [string]
 *     ...
 *     other data
 * }
 */

class ParseError extends Error{
    constructor(message) {
        super();
        this.message = message;
    }
}

/**
 * Create a new websocket connection to a running game.
 */
class Connection{
    constructor(ws, req, gameManager, gameManagerEndpoint){
        this.req = req;
        this.ws  = ws;
        this.gm  = gameManager;
        this.gme = gameManagerEndpoint;

        this.game = undefined;
        this.name = undefined;
        this.role = undefined;
    }

    /**
     * Perform the connection.
     * Check for host in session,
     * - If host, add listener.
     * - If not host,
     * Check for name in session.
     * - If no name, reject connection.
     * - If name, add player and listener
     */
    async connect(){
        console.log("#connect");
        await this.establishConnection();
        this.send(this.game.getUpdate());
    }

    /**
     * Establish a connection between a client (either host or contestant) and
     * the game.  Either GameManagerEndpoint#join-game, or GameManagerEndpoint#connect-host
     * must be called prior to establishing this websocket connection.
     * @returns {Promise<void>}
     */
    async establishConnection(){
        let sessionHash = this.req.session.hash;
        [this.game, this.name, this.role] = this.connectionInfo(sessionHash);
        this.addListeners();
        logger.log(`#establishConnection ${this.name} ${this.role}`);
    }

    addListeners() {
        if (!this.game) throw new Error("Uninitialized Connection");
        if (!this.name) throw new Error("Uninitialized Connection");

        this.game.addListener(this.name, msg => {
            this.ws.send(JSON.stringify(msg));
        });

        this.ws.on('message', (message) => {
            try {
                this.parseMessage(message);
            } catch (err) {
                let msg = {
                    action : "error",
                    text   : err.msg
                }
                this.ws.send(JSON.stringify(msg));
                console.log(err);
            }
        });

        this.send({
            action : "connection_established",
            data : {
                name : this.name,
                role : this.role
            }
        });
        setInterval(()=>this.ping(), 15000);
    }

    connectionInfo(sessionHash) {
        try {
            const gameHash = this.gme.getGameHash(sessionHash)
            const game = this.gm.getLiveGame(gameHash);
            const name = this.gme.getName(sessionHash);
            const role = this.gme.getRole(sessionHash);
            return [game, name, role];
        } catch (err){
            console.error(err);
            const response = new ErrorResponse(err.toString(), err);
            this.ws.send(JSON.stringify(response.object));
            this.ws.close();
            return;
        }
    }

    ping(){
        this.ws.send(`{"action":"ping"}`);
    }

    send(msg){
        this.ws.send(JSON.stringify(msg));
    }

    parseMessage(json){
        let msg = JSON.parse(json);
        logger.log("#parseMessage " + msg.action);
        msg.player = this.name;

        switch (msg.action){
            case "request_model":
                this.send(this.game.getUpdate());
            break;
            case "remove_player":
                if (this.name !== config.names.HOST) return;
                this.gme.removePlayerFromGame(msg.data.name, this.game);
                this.game.onInput(msg, this);
            break;
            default:
                this.game.onInput(msg, this);
            break;
         }
    }
}

export default Connection;