import FS from "fs";
import Logger from "@thaerious/logger";
import constants from "./constants.js";
import NidgetPreprocessor from "./NidgetPreprocessor.js";
import Path from "path";
import renderEJS from "./renderEJS.js";
import renderJS from "./RenderJS.js";
import Crypto, { getFips } from "crypto";
import ParseArgs from "@thaerious/parseargs";
import parseArgsOptions from "./parseArgsOptions.js";
import getFiles from "./getFiles.js";

const args = new ParseArgs().loadOptions(parseArgsOptions).run();
const logger = Logger.getLogger();

logger.channel("standard").enabled = true;
logger.channel("verbose").enabled = false;
logger.channel("very-verbose").enabled = false;

if (args.count("silent") > 0) logger.channel("standard").enabled = false;
if (args.count("verbose") >= 1) logger.channel("verbose").enabled = true;
if (args.count("verbose") >= 2) logger.channel("very-verbose").enabled = true;

class Watcher {
    constructor() {
        this.blacklist = new Set();
        this.md5 = new Map();

        if (!FS.existsSync(constants.GENERATED_DIR)) {
            FS.mkdirSync(constants.GENERATED_DIR, { recursive: true });
        }
    }

    watch() {
        logger.channel("standard").log("Watching Files - ctrl-c to Exit");
        for (let dir of [...constants.NIDGET_PATH, ...constants.ROOT_PATH]) {
            logger.channel("verbose").log(`Watching directory: ${dir}`);
            let recursive = false;
            if (dir.endsWith("/**")) {
                recursive = true;
                dir = dir.substring(0, dir.length - 3);
            }

            logger.channel("verbose").log(dir);
            FS.watch(dir, { recursive: true }, async (e, f) => await this.listener(dir, e, f));
        }
    }

    async startup() {
        this.nidget_preprocessor = new NidgetPreprocessor();
        this.nidget_preprocessor.addNidgetPath(...constants.NIDGET_PATH);
        this.nidget_preprocessor.addRootPath(...constants.ROOT_PATH);
    }

    async renderAllRecords() {
        logger.channel("standard").log("rendering files:");
        for (const record of this.nidget_preprocessor.records) {
            this.renderRecord(record);
        }

        for (const filename of getFiles(...constants.NIDGET_PATH, ...constants.ROOT_PATH)) {
            const md5_hash = Crypto.createHash("md5").update(FS.readFileSync(filename)).digest("hex");
            this.md5.set(filename, md5_hash);
        }
    }

    async renderRecord(record) {
        if (record.root) {
            if (record.script) {
                logger.channel("standard").log(record.script);
                await this.browserify(record.script);
            }
            if (record.view) {
                logger.channel("standard").log(record.view);
                this.render(record.view);
            }
        }
    }

    async listener(directory, event, filename) {
        const fullpath = Path.join(directory, filename);

        if (this.blacklist.has(filename)) return;
        this.blacklist.add(filename);

        const md5_hash = Crypto.createHash("md5").update(FS.readFileSync(fullpath)).digest("hex");
        if (this.md5.has(filename) && this.md5.get(filename) === md5_hash) return;
        this.md5.set(filename, md5_hash);

        if (FS.existsSync(fullpath) && FS.statSync(fullpath).isFile()) {
            logger.channel("verbose").log(`File Change Detected: ${filename}`);
            if (filename.endsWith(".js")) await this.browserify(filename);
            if (filename.endsWith(".ejs")) this.render(filename);
        }
    }

    async browserify(filename) {
        const nidget_preprocessor = new NidgetPreprocessor();
        nidget_preprocessor.addNidgetPath(...constants.NIDGET_PATH);
        nidget_preprocessor.addRootPath(...constants.ROOT_PATH);
        const parsed = Path.parse(filename);
        const dependents = nidget_preprocessor.reverseLookup(parsed.name);

        for (const rec of dependents) {
            if (rec.root && rec.script) {
                logger.channel("verbose").log(`browserify: ${rec.script}`);
                const outputPath = Path.join(constants.GENERATED_DIR, Path.parse(rec.script).name + ".js");

                try {
                    await renderJS(rec.script, rec.dependencies, outputPath);
                } catch (error) {
                    console.log(error.constructor.name);
                    console.log(error.toString());
                    console.log(error.code);
                }
            }
        }
    }

    // re-render all root files that depend on filename
    render(filename) {
        const nidget_preprocessor = new NidgetPreprocessor();
        nidget_preprocessor.addNidgetPath(...constants.NIDGET_PATH);
        nidget_preprocessor.addRootPath(...constants.ROOT_PATH);
        const parsed = Path.parse(filename);
        const dependents = nidget_preprocessor.reverseLookup(parsed.name);

        for (const rec of dependents) {
            if (rec.root) {
                renderEJS(rec.view, rec.dependencies, constants.GENERATED_DIR);
            }
        }

        this.blacklist.delete(filename);
    }
}

const watcher = new Watcher();

if (args.flags["filename"]) {
    await watcher.startup();
    const parsed = Path.parse(args.flags["filename"]);
    const record = watcher.nidget_preprocessor.getRecord(parsed.name);
    if (record) {
        logger.channel("very-verbose").log(record.toString());
        await watcher.renderRecord(record);
    }
} else {
    await watcher.startup();
    await watcher.renderAllRecords();
}

if (args.flags["watch"]) {
    watcher.watch();
}
