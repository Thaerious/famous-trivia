import config from "./config.js";
import ReportCoverage from "./mechanics/ReportCoverage.js";
import Connection from "./game/Connection.js";
import cors from "./mechanics/cors.js";
import Express from "express";
import http from "http";
import BodyParser from "body-parser";
import helmet from "helmet";
import UserAgent from "express-useragent";
import WebSocket, { WebSocketServer } from 'ws';

import Logger from '@thaerious/logger';
const logger = Logger.getLogger();

class Server {
    /**
     * @param sessionManager
     * @param gameManager
     * @param gameManagerEndpoint
     * @param nidgetPreprocessor
     * @param cors
     * @param jitFlag
     */
    constructor (sessionManager, gameManager, gameManagerEndpoint, cors) {
        this.app = Express();
        this.httpServer = http.createServer(this.app);

        this.setupExternals();
        this.setupSessionManagerEndpoint(sessionManager);
        this.setupGameManagerEndpoint(sessionManager, gameManagerEndpoint);
        this.setupReportCoverageEndpoint();
        this.setupPageRenderingEndpoints(cors);
        this.setupWebsocket(sessionManager, gameManager, gameManagerEndpoint);
        this.setup404();

        process.on(`SIGINT`, () => this.stop());
        process.on(`SIGTERM`, () => this.stop());
    }

    start (port, ip = `0.0.0.0`) {
        /** Start the index **/
        this.httpServer.listen(port, ip, () => {
            console.log(`HTTP listener started on port ${port}`);
        });
    }

    stop () {
        console.log(`Stopping server`);
        this.httpServer.close();
        process.exit();
    }

    setupExternals () {
        this.app.use(helmet()); // automatic security settings (outgoing response headers)
        this.app.use(UserAgent.express()); // used to determine what the connection is using (phone,browser etc)
    }

    setupSessionManagerEndpoint (sessionManager) {
        this.app.use(`/*.html`, sessionManager.middleware);
        this.app.use(`/game-manager-service`, sessionManager.middleware);
    }

    setupGameManagerEndpoint (sessionManager, gameManagerEndpoint) {
        this.app.use(`/game-manager-service`, BodyParser.json());
        this.app.use(`/game-manager-service`, gameManagerEndpoint.middleware);
    }

    setupReportCoverageEndpoint () {
        this.app.use(`/report-coverage`, BodyParser.json({ limit: `50mb` }));
        this.app.use(`/report-coverage`, new ReportCoverage().middleware);
    }

    setupPageRenderingEndpoints () {
        this.app.use(`*`, (req, res, next) => {
            // logger when -v/--verbose flag is active
            const ip = req.headers[`x-forwarded-for`] || req.socket.remoteAddress;
            logger.channel(`server`).log(ip + ` ` + req.originalUrl);
            next();
        });

        this.app.get(`*`, cors);
        this.app.get(`/`, (req, res) => {
            // serve the index file by default
            res.sendFile(`html/index.html`, { root: config.server.PUBLIC_STATIC });
        });

        this.app.get(`/*.html`, cors);
        this.app.use(Express.static(config.server.PUBLIC_STATIC));
        this.app.use(Express.static(config.server.PUBLIC_GENERATED));
    }

    setupWebsocket (sessionManager, gameManager, gameManagerEndpoint) {
        const wss = new WebSocketServer({ server: this.httpServer, path: `/game-service.ws` });
        wss.on(`connection`, async (ws, req) => {
            logger.channel(`server`).log(`/game-service.ws`);
            await sessionManager.applyTo(req);

            try {
                await new Connection(ws, req, gameManager, gameManagerEndpoint, sessionManager).connect();
            } catch (err) {
                console.log(err);
                console.log(`ERROR: ` + err.message);
                const msg = {
                    action: `error`,
                    text: err.message
                };
                ws.send(JSON.stringify(msg));
            }
        });
    }

    setup404 () {
        this.app.use(`*`, (req, res) => {
            logger.channel(`server`).log(`404 ` + req.originalUrl);
            res.statusMessage = `Page Not Found: 404`;
            res.status(404);
            res.send(`404: page not found`);
            res.end();
        });
    }
}

export default Server;
