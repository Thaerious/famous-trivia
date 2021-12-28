import FS, { watch } from "fs";
import Logger from "@thaerious/logger";
import constants from "./constants.js";
import NidgetPreprocessor from "./NidgetPreprocessor.js";
import Path from "path";
import renderEJS from "./renderEJS.js";
import renderJS from "./RenderJS.js";
import renderSCSS from "./renderSCSS.js";
import Crypto, { getFips } from "crypto";
import ParseArgs from "@thaerious/parseargs";
import parseArgsOptions from "./parseArgsOptions.js";
import glob_fs from "glob-fs";
const glob = glob_fs();

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
        this.paths = [];
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
        logger.channel("verbose").log("# startup");
        this.nidget_preprocessor = new NidgetPreprocessor();

        let settings = {};
        if (FS.existsSync(constants.NIDGET_PROPERTY_FILE)) {
            const settings_text = FS.readFileSync(constants.NIDGET_PROPERTY_FILE);
            settings = JSON.parse(settings_text);

            if (settings.input) for (const path of settings.input) this.addPath(path);
        }

        const directories = args.args.slice(2);

        for (const dir of directories) this.addPath(dir);
        this.output_path = settings.output ?? constants.DEFAULT_OUTPUT;

        if (args.flags["output"]) this.output_path = args.flags["output"];

        if (!FS.existsSync(this.output_path)) {
            FS.mkdirSync(this.output_path, { recursive: true });
        }
    }

    addPath(path) {
        this.paths.push(path);
        this.nidget_preprocessor.addPath(path);
    }

    async renderAllRecords() {
        logger.channel("verbose").log("# render all records");

        for (const record of this.nidget_preprocessor.records) {
            await this.renderRecord(record);  
        }

        logger.channel("verbose").log("# hash files");
        for (const input_path of this.paths) {
            for (const filename of glob.readdirSync(input_path)) {
                if (!FS.lstatSync(filename).isDirectory()){
                    const md5_hash = Crypto.createHash("md5").update(FS.readFileSync(filename)).digest("hex");
                    this.md5.set(filename, md5_hash);
                }
            }
        }
    }

    async renderRecord(record) {
        logger.channel("very-verbose").log(record.toString());

        if (record.type === "view") {
            if (record.script) {
                await this.browserify(record);
            }
            if (record.view) {
                this.render(record);
            }
        }

        if (record.type === "view" || record.type === "nidget") {
            if (record.style) {
                renderSCSS(record.style, Path.join(this.output_path, record.name + ".css"));
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

    async browserify(record) {
        const nidget_preprocessor = new NidgetPreprocessor();
        nidget_preprocessor.addPath(...this.paths);

        const outputPath = Path.join(this.output_path, Path.parse(record.script).name + ".js");

        try {
            await renderJS(record.script, record.dependents, outputPath);
        } catch (error) {
            console.log(error.constructor.name);
            console.log(error.toString());
            console.log(error.code);
        }
    }

    render(record) {
        const nidget_preprocessor = new NidgetPreprocessor();
        nidget_preprocessor.addPath(...this.paths);

        renderEJS(record.view, record.dependents, this.output_path);
        this.blacklist.delete(record.view);
    }
}

const watcher = new Watcher();
await watcher.startup();

if (args.flags["name"]){
    await watcher.renderRecord(watcher.nidget_preprocessor.getRecord(args.flags["name"]));
}else{
    await watcher.renderAllRecords();
}

if (args.flags["watch"]) {
    watcher.watch();
}
