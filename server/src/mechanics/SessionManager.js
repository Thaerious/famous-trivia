// noinspection SqlNoDataSourceInspection,SqlDialectInspection

import crypto from "crypto";
import constants from "../config.js";
import HasDB from './HasDB.js';
import Logger from "@thaerious/logger";

const logger = Logger.getLogger();

/**
 * When the server serves a page that has the SessionManager middleware a
 * session instance is attached to the request (see #middleware).  The response, if
 * there is one, will have a cookie set to the session hash value.
 * <br>
 * A session instance can be used (via #hash) to uniquely identify the request.
 * Any values set on the session instance (see #get) will be stored in a
 * persistent database and retrieved across server instances (see #load).
 * <br>
 * When another endpoint receives a request that has already passed through the
 * middleware the session can be accessed with 'req.session', and identified
 * with 'req.session.hash'.
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
            this.sessions[sessionRow.session] = new SessionInstance(this, sessionRow.session);
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
            this.sessions[sessionHash] = new SessionInstance(this, sessionHash);
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

    /**
     * Return all sessions that has the parameter 'key' set.
     * @param key The parameter in question.
     * @param value If set, only return parameters that match.
     * @returns {*[]}
     */
    reverseLookup(key, value = undefined) {
        let sessions = [];

        if (!value) {
            for (const hash in this.sessions) {
                const sessionInstance = this.sessions[hash];
                if (sessionInstance.has(key)) sessions.push(hash);
            }
        } else {
            for (const hash in this.sessions) {
                const sessionInstance = this.sessions[hash];
                if (sessionInstance.has(key, value)) sessions.push(hash);
            }
        }

        return sessions;
    }
}

class SessionInstance {
    constructor(sessionManager, hash) {
        this.DB = sessionManager;
        this._hash = hash;
        this.values = {};
    }

    /**
     * Read saved parameters from the DB to the live server for this session.
     * @returns {Promise<void>}
     */
    async load() {
        let cmd = `SELECT name, value
                   FROM parameters
                   WHERE session = (?)`;
        let values = [this.hash];
        let valueRows = await this.DB.all(cmd, values);

        logger.channel("verbose").log(`loading session values for: ${this.hash.substring(0, 8)}`);
        for (let valueRow of valueRows) {
            this.values[valueRow.name] = valueRow.value;
            logger.channel("verbose").log(`${valueRow.name}:${valueRow.value}`);
        }
    }

    /**
     * List all keys for which there is a value.
     * @returns {string[]}
     */
    listKeys() {
        return Object.keys(this.values);
    }

    /**
     * Determine if a key has an assigned value.
     * @param key
     * @returns {boolean}
     */
    has(key, value = undefined) {
        if (!value) {
            return this.values[key] !== undefined;
        } else {
            return this.values[key] === value;
        }
    }

    /**
     * Remove the specified key.
     */
    async clear(key) {
        delete this.values[key];
        const cmd = "DELETE FROM parameters WHERE name = (?)";
        const values = [key];
        await this.DB.run(cmd, values);
    }

    /**
     * Retrieve a key's assigned value.
     * Return undefined if there is no key.
     * @param key
     * @returns {*}
     */
    get(key) {
        if (!this.has(key)) return undefined;
        return this.values[key];
    }

    /**
     * Assign a value to a key.
     * Replaces any value that was previously assigned.
     * @param key
     * @param value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        this.values[key] = value;
        let cmd = `REPLACE INTO parameters
                   VALUES (?, ?, ?)`;
        let values = [this.hash, key, value];
        await this.DB.run(cmd, values);
    }

    get hash() {
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