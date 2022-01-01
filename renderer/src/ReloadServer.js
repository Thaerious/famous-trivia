// noinspection JSCheckFunctionSignatures
import Express from "express";
import http from "http";
import { WebSocketServer } from 'ws';

import Logger from '@thaerious/logger';
const logger = Logger.getLogger();

class ReloadInstance{
    constructor(server, ws){
        logger.channel("verbose").log("reload_url.ws opened");
        this.server = server;
        this.ws = ws;
        this.server.connections.add(this);
        // ping(ws);

        ws.on('close', async (ws, req) => {
            logger.channel("verbose").log("reload_url.ws closed");
            server.connections.delete(this);
        });
    }

    notify(url){
        const msg = {
            action : `reload`,
            url : url
        }
        this.ws.send(JSON.stringify(msg));
    }
}

function ping(ws){
    console.log("ping");
    ws.send(JSON.stringify({action : "ping"}));
    setTimeout(()=>ping(ws), 1000);
}

class ReloadServer {
    constructor() {
        this.app = Express();
        this.httpServer = http.createServer(this.app);
        this.connections = new Set();
    }

    start(port = 41141, ip = "0.0.0.0") {
        this.httpServer.listen(port, ip, () => {
            logger.channel("standard").log(`Page reload listener started on port ${port}`);
        });

        const wss = new WebSocketServer({server: this.httpServer, path: "/reload_url.ws"});

        wss.on('connection', async (ws, req) => {
            new ReloadInstance(this, ws);
        });     
    }

    stop(cb = () => {}) {
        this.httpServer.close(cb);
    }

    notify(url){
        for (const connection of this.connections) connection.notify(url);
        logger.channel("verbose").log(`${this.connections.size} listeners notified`);
        logger.channel("verbose").log(`notify all ${url}`);
    }
}

export default ReloadServer;