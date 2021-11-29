// noinspection JSCheckFunctionSignatures
import cors from './mechanics/cors.js';
import GameManager from "./game/GameManager.js";
import CLI from './CLI.js';
import SessionManager from "./mechanics/SessionManager.js";
import Path from 'path';
import NidgetPreprocessor from "./mechanics/NidgetPreprocessor.js";
import EJSRender from "./mechanics/EJSRender.js";
import config from "../config.js";
import ParseArgs from "@thaerious/parseargs";
import clean from "./clean.js";
import setupDB from "./game/setupDB.js";
import Server from "./Server.js";
import GameManagerEndpoint from "./game/GameManagerEndpoint.js";
import NameValidator from "./game/NameValidator.js";
import verify from "./mechanics/verify.js";
import parseArgsOptions from './parseArgsOptions.js';
import Logger from './Logger.js';

const flags = new ParseArgs().loadOptions(parseArgsOptions).run().flags;
const logger = Logger.getLogger();
logger.channel("log").prefix = (f, l)=>`l ${f}:${l}\t `;
logger.channel("verbose").prefix = (f, l)=>`v ${f}:${l}\t `;
logger.channel('verbose').enabled = flags['verbose'];

if (flags['help']){
    console.log("index.js [opts]");
    console.log("\n");
    console.log("Options:");
    console.log("-s,\t--start\tStart the server");
    console.log("-r,\t--render\tGenerate .js & .html files then exit");
    console.log("-j,\t--jit\t\tGenerate .js & .html files on demand");
    console.log("-i,\t\t\tStartup in interactive mode");
    console.log("\t--clean\t\tRemove all generated files, do not run index.");
    console.log("--ta,\t\t\tTime to answer");
    console.log("--tb,\t\t\tTime to buzz in");
    console.log("--tm,\t\t\tTime for multi-choice round");
    process.exit();
}

let nidgetPreprocessor = null;
if (flags['render'] || flags['start']){
    logger.channel('verbose').log("initializing nidget pre processor");
    nidgetPreprocessor = new NidgetPreprocessor(config.server.NIDGET_EJS_SRC, config.server.NIDGET_JS_DIR).setup();
}

if (process.env.NODE_ENV === 'test'){
    logger.channel('log').log("initializing pre processor");
} 

if (flags['clean']){
    logger.channel('verbose').log("operation clean");
    clean();
}

if (flags['render']){
    logger.channel('verbose').log("operation render");
    await EJSRender.render(nidgetPreprocessor);
}

if (flags['i']) {
    logger.channel('verbose').log("interactive mode");
    new CLI(gameManager, sessionManager);
}

if (flags['start']){
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
    const server = new Server(sessionManager, gameManager, gameManagerEndpoint, nidgetPreprocessor, cors, flags['jit']);
    server.start(config.server.port);
}
