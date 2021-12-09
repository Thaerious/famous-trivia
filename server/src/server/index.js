// noinspection JSCheckFunctionSignatures
import cors from './mechanics/cors.js';
import GameManager from "./game/GameManager.js";
import SessionManager from "./mechanics/SessionManager.js";
import Path from 'path';
import config from "../config.js";
import ParseArgs from "@thaerious/parseargs";
import setupDB from "./game/setupDB.js";
import Server from "./Server.js";
import GameManagerEndpoint from "./game/GameManagerEndpoint.js";
import NameValidator from "./game/NameValidator.js";
import verify from "./mechanics/verify.js";
import parseArgsOptions from './parseArgsOptions.js';
import Logger from '@thaerious/logger';

const flags = new ParseArgs().loadOptions(parseArgsOptions).run().flags;
const logger = Logger.getLogger();
logger.channel("log").prefix = (f, l)=>`l ${f}:${l}\t `;
logger.channel("verbose").prefix = (f, l)=>`v ${f}:${l}\t `;
logger.channel('verbose').enabled = flags['verbose'];

logger.channel('verbose').log("setting up database");
await setupDB(config.server.db.dir, config.server.db.name, config.server.db.script_full_path);

logger.channel('verbose').log("initializing game manager");
const gameManager = new GameManager();
gameManager.timeAnswer = flags['ta'];
gameManager.timeBuzz = flags['tb'];
gameManager.timeMultipleChoice = flags['tm'];    

logger.channel('verbose').log("initializing session manager");
const sessionManager = new SessionManager(Path.join(config.server.db.dir, config.server.db.name));

logger.channel('verbose').log("loading session manager");
await sessionManager.load();

logger.channel('verbose').log("initializing end point");
const gameManagerEndpoint = new GameManagerEndpoint(gameManager, new NameValidator(), verify);    

logger.channel('verbose').log("starting server");
const server = new Server(sessionManager, gameManager, gameManagerEndpoint, cors);
server.start(flags['port']);