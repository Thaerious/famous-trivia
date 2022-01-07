// noinspection SqlNoDataSourceInspection,SqlDialectInspection

import crypto from "crypto";
import constants from "../config.js";
import HasDB from './HasDB.js';
import Logger from "@thaerious/logger";

const logger = Logger.getLogger();

/**
 * Assigns or retrieves an identifying hash value on an http request object.
 * Any request without a session cookie will have one assigned to it' matchin response.
 * Any request with an expired session cookie will have a new one assigned to it's response.
 * Requests from the same user will have the same session cookie (assigned by the browser)
 * and can be identified by their hash.
 * <br>
 * The hash value is stored in the session parameter of a request object (req.session).
 * <br>
 * When another endpoint receives a request that has already passed through the
 * middleware the session can be idetified with 'req.session.hash'.
 */
class SessionManager extends HasDB {
    constructor(path) {
        super(path);
        this.sessions = {};
    }

    /**
     * Read session information from the DB to the live server.
     * @returns {Promise<void>}
     */
    async load() {
        logger.channel("verbose").log("loading sessions");
        this.sessions = {};
        await this.clearOldSessions();

        if (SessionManager.SETTINGS.SESSION_CLEAR_DELAY_MIN >= 0) {
            this.interval = setInterval(() => this.clearOldSessions(), SessionManager.SETTINGS.SESSION_CLEAR_DELAY_MIN * 60 * 1000);
        }

        let sessionRows = await this.all("SELECT session FROM Sessions");
        for (let sessionRow of sessionRows) {
            this.sessions[sessionRow.session] = new SessionInstance(sessionRow.session);
            await this.sessions[sessionRow.session].load();            
        }
    }

    /**
     * Remove all Live and DB session information.
     * @returns {Promise<void>}
     */
    async clearAll() {
        await this.clearLive();
        await this.clearDB();
    }

    /**
     * Remove all Live session information.
     * @returns {Promise<void>}
     */
    async clearLive() {
        this.sessions = {};
    }

    /**
     * Remove all DB session information.
     * @returns {Promise<void>}
     */
    async clearDB() {
        await this.run("DELETE FROM 'sessions'");
        await this.run("DELETE FROM 'parameters'");
    }

    /**
     * Remove all expired sessions from the DB.
     */
    async clearOldSessions() {
        let expired = new Date().getTime();
        await this.run(`DELETE
                        FROM sessions
                        WHERE expires < ${expired};`);
        await this.run(`DELETE
                        FROM parameters
                        WHERE session NOT IN (SELECT session FROM sessions);`)
    }

    /**
     * Adds session cookies to browsers that don't have one.
     * Attaches the SessionInstance to the request.
     * @returns {function(...[*]=)}
     */
    get middleware() {
        return async (req, res, next) => {
            await this.applyTo(req, res);
            next();
        }
    }

    /**
     * Call #validateSession with values from the http request.
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async applyTo(req, res) {
        let cookies = new Cookies(req.headers.cookie);
        let sessionHash = undefined;

        if (cookies.has(SessionManager.SETTINGS.SESSION_COOKIE_NAME)) {
            sessionHash = cookies.get(SessionManager.SETTINGS.SESSION_COOKIE_NAME);
        }

        sessionHash = await this.validateSession(sessionHash);

        if (res) {
            res.cookie(SessionManager.SETTINGS.SESSION_COOKIE_NAME, sessionHash, {maxAge: SessionManager.SETTINGS.SESSION_EXPIRE_HOURS * 60 * 60 * 1000});
        }

        if (!req.session) {
            req.session = this.getSession(sessionHash);
        }
    }

    /**
     * If hash is omitted, or found to be expired, create a new session.
     * This session is added to both Live and the DB.
     * @returns {String} Session hash to send to the client, may or may not be new.
     */
    async validateSession(sessionHash) {
        let expires = new Date().getTime() + SessionManager.SETTINGS.SESSION_EXPIRE_HOURS * 60 * 60 * 1000;

        if (!sessionHash || !this.sessions[sessionHash]) {
            sessionHash = crypto.randomBytes(64).toString('hex');
        }

        if (!this.sessions[sessionHash]) {
            await this.saveHash(sessionHash, expires);
        }
        return sessionHash;
    }

    /**
     * Retrieve a session
     * @param sessionHash
     * @returns {*}
     */
    getSession(sessionHash) {
        if (!this.sessions[sessionHash]) {
            this.sessions[sessionHash] = new SessionInstance(sessionHash);
        }

        return this.sessions[sessionHash];
    }

    /**
     * Store a session hash in the database.
     * @param session
     * @param expires
     * @returns {Promise<void>}
     */
    async saveHash(session, expires) {
        let cmd = `REPLACE INTO sessions
                   VALUES (?, ?)`;
        let values = [session, expires];
        await this.run(cmd, values);
    }

    /**
     * Returns a list of truncated session hashes.
     * Used for CLI
     * @returns {*[]}
     */
    listHashes() {
        let r = [];
        for (let key of Object.keys(this.sessions)) {
            r.push(key.substring(0, 6));
        }
        return r;
    }
}

class SessionInstance {
    constructor(hash) {
        this._hash = hash;
    }

    get hash(){
        return this._hash;
    }
}

class Cookies {
    constructor(string) {
        string = string ?? "";
        this.cookies = {};
        let rawCookies = string.split('; ');
        rawCookies.forEach(raw => {
            let keyValue = raw.split("=");
            this.cookies[keyValue[0]] = keyValue[1];
        });
    }

    get(key) {
        return this.cookies[key];
    }

    has(key) {
        return this.cookies[key] !== undefined;
    }
}

SessionManager.SETTINGS = {};
Object.assign(SessionManager.SETTINGS, constants.sessions);

export default SessionManager;