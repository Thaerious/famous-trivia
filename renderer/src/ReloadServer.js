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
        this.isAlive = true;

        ws.on('close', async (ws, req) => {
            logger.channel("verbose").log("reload_url.ws closed");
            server.connections.delete(this);
            clearInterval(this.heartbeat);
        });
    }

    setupHeartBeat(){
        this.ws.on('pong', ()=>this.isAlive = true);

        this.heartbeat = setInterval(()=>{
            if (!this.isAlive) return ws.terminate();
            this.isAlive = false;
            this.ws.ping();
        }, 10000);
    }

    notify(url){
        const msg = {
            action : `reload`,
            url : url
        }
        this.ws.send(JSON.stringify(msg));
    }

    error(message){
        const msg = {
            action : `error`,
            message : message
        }
        this.ws.send(JSON.stringify(msg));
    }    
}

function ping(ws){
    ws.send(JSON.stringify({action : "ping"}));
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

    error(message){
        for (const connection of this.connections) connection.error(message);
    }
}

export default ReloadServer;