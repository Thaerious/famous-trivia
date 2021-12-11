// noinspection JSCheckFunctionSignatures,DuplicatedCode

import cors from './mechanics/cors.js';
import SingleGameManager from "./game/singleInstance/SingleGameManager.js";
import CLI from './CLI.js';
import SessionManager from "./mechanics/SessionManager.js";
import Path from 'path';
import NidgetPreprocessor from "./mechanics/NidgetPreprocessor.js";
import EJSRender from "./mechanics/EJSRender.js";
import config from "../config.js";
import ParseArgs from "@thaerious/parseargs";
import clean from "../clean.js";
import setupDB from "./game/setupDB.js";
import Server from "./Server.js";
import SingleGameManagerEndpoint from "./game/singleInstance/SingleGameManagerEndpoint.js";
import fs from "fs";
import NameValidator from "./game/NameValidator.js";
import verify from "./mechanics/verify.js";

await setupDB(config.server.db.dir, config.server.db.name, config.server.db.script_full_path);

const gameManager = await new SingleGameManager();
const sessionManager = new SessionManager(Path.join(config.server.db.dir, config.server.db.name));
await sessionManager.load();
const gameManagerEndpoint = new SingleGameManagerEndpoint(gameManager, sessionManager, new NameValidator(), verify);
const nidgetPreprocessor = new NidgetPreprocessor(config.server.ejs_nidgets, config.server.nidget_scripts).setup();

const parsedArgs = new ParseArgs().loadOptions().run();
const flags = parsedArgs.flags;
if (process.env.NODE_ENV === 'test') console.log("Test Mode");

if (flags['help']){
    console.log("index.js [opts]");
    console.log("\n");
    console.log("Options:");
    console.log("-b,\t--browserify\tGenerate .js & .html files on startup");
    console.log("-r,\t--render\tGenerate .js & .html files then exit");
    console.log("-j,\t--jit\t\tGenerate .js & .html files on demand");
    console.log("-i,\t\t\tStartup in interactive mode");
    console.log("\t--clean\t\tRemove all generated files, do not run index.");
    console.log("--ta,\t\t\tTime to answer");
    console.log("--tb,\t\t\tTime to buzz in");
    console.log("--tm,\t\t\tTime for multi-choice round");
    process.exit();
}

if (flags['clean']){
    clean();
    process.exit();
}

if (flags['render']){
    await EJSRender.render(nidgetPreprocessor);
    process.exit();
}

if (flags['browserify']){
    await EJSRender.render(nidgetPreprocessor);
}

if (flags['i']) {
    new CLI(gameManager, sessionManager);
}

if (!fs.existsSync(parsedArgs.args[2])){
    console.log(`Unknown file: ${parsedArgs.args[2]}`);
    console.log(parsedArgs);
    process.exit();
}

const gameDescriptionModel = await fs.readFileSync(parsedArgs.args[2]);
gameManager.load(gameDescriptionModel.toString());

gameManager.timeAnswer = flags['ta'] ?? config.TIMES.ANSWER;
gameManager.timeBuzz = flags['tb'] ?? config.TIMES.BUZZ;
gameManager.timeMultipleChoice = flags['tm'] ?? config.TIMES.MULTIPLE_CHOICE;

console.log(gameManager.game.times);

const server = new Server(sessionManager, gameManager, gameManagerEndpoint, nidgetPreprocessor, cors, flags['jit']);
server.start(config.server.port);
