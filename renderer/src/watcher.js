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
import ReloadServer from "./ReloadServer.js";

const args = new ParseArgs().loadOptions(parseArgsOptions).run();
const logger = Logger.getLogger();

logger.channel("standard").enabled = true;
logger.channel("verbose").enabled = false;
logger.channel("very-verbose").enabled = false;
logger.channel("debug").enabled = true;

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
        for (let dir of this.paths) {
            logger.channel("verbose").log(`Watching directory: ${dir}`);
            let recursive = false;
            new glob_fs().readdirSync(dir)

            logger.channel("verbose").log(dir);
            if (dir.endsWith("/**")){
                dir = dir.substring(0, dir.length - 3);
                FS.watch(dir, { recursive: true }, async (e, f) => await this.listener(dir, e, f));
            } else {
                if (dir.endsWith("/*")) dir = dir.substring(0, dir.length - 2);
                FS.watch(dir, { recursive: false }, async (e, f) => await this.listener(dir, e, f));
            }
        }
        this.reload_server = new ReloadServer();
        this.reload_server.start(constants.RELOAD_SERVER_PORT);
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
            for (const filename of glob_fs().readdirSync(input_path)) {
                if (!FS.lstatSync(filename).isDirectory()){
                    const md5_hash = Crypto.createHash("md5").update(FS.readFileSync(filename)).digest("hex");
                    this.md5.set(filename, md5_hash);
                    logger.channel("very-verbose").log(filename + " " + md5_hash);
                }
            }
        }
    }

    async renderRecord(record) {
        logger.channel("debug").log(record.toString());

        if (record.type === "view") {
            if (record.script) {
                try{
                    await this.browserify(record);
                } catch (err){
                    console.log(err);
                    process.exit();
                }
            }
            if (record.view) {
                this.render(record);
            }
        }

        if (record.type === "view" || record.type === "nidget") {
            this.scss(record);
        }
    }

    async listener(directory, event, filename) {
        logger.channel("very-verbose").log(`File Change Pending: ${filename}`);
        const fullpath = Path.join(directory, filename);

        if (this.blacklist.has(filename)) return;
        this.blacklist.add(filename);

        // Compare and/or update md5 hashes to see if the file has actually changed.
        const md5_hash = Crypto.createHash("md5").update(FS.readFileSync(fullpath)).digest("hex");
        if (this.md5.has(filename) && this.md5.get(filename) === md5_hash){
            this.blacklist.delete(filename);
             return;
        }
        this.md5.set(filename, md5_hash);

        if (FS.existsSync(fullpath) && FS.statSync(fullpath).isFile()) {
            logger.channel("verbose").log(`File Change Detected: ${fullpath}`);
            this.nidget_preprocessor.reprocess();
            const record = this.nidget_preprocessor.getRecord(filename);
            if (record) logger.channel("debug").log(record.toString());
            else logger.channel("verbose").log(`no record found for ${filename}`);

            switch (record.type){
                case "nidget":
                    if (record.script === fullpath) {
                        for (const parent of record.parents){
                            if (parent.type === "view") await this.browserify(parent);
                        }
                    }
                    if (record.style === fullpath) this.scss(record);
                    if (record.view === fullpath) {
                        for (const parent of record.parents){
                            if (parent.type === "view") this.render(parent);
                        }
                    }
                break;
                case "include":
                    if (record.script === fullpath) {
                        for (const parent of record.parents){
                            if (parent.type === "view") await this.browserify(parent);
                        }
                    }
                    if (record.style === fullpath) {              
                        for (const parent of record.parents){
                            if (parent.type === "view") await this.browserify(parent);
                            if (parent.type === "nidget") await this.browserify(parent);
                        }
                    }
                    if (record.view === fullpath) {
                        for (const parent of record.parents){
                            if (parent.type === "view") this.render(parent);
                        }
                    }                    
                break;
                case "view":
                    if (record.script === fullpath) await this.browserify(record);
                    if (record.view === fullpath) this.render(record);
                    if (record.script === fullpath) this.scss(record);
                break;
            }

            if (record.type === "view") this.reload_server.notify(record.name + ".html");
            for (const parent of record.parents){
                if (parent.type === "view"){
                    this.reload_server.notify(parent.name + ".html");
                }
            }
        }
        
        this.blacklist.delete(filename);
    }

    async browserify(record) {
        const outputPath = Path.join(this.output_path, Path.parse(record.script).name + ".js");

        try {
            await renderJS(record.script, record.dependents, outputPath);
        } catch (error) {            
            console.log(error.toString());
            console.log(error.code);
            console.log(record.script);
            process.exit();
        }
    }

    render(record) {
        renderEJS(record.view, record.dependents, this.output_path);
        this.blacklist.delete(record.view);
    }

    scss(record){
        if (record.style) {
            const outname = Path.parse(record.style).name + ".css";
            renderSCSS(record.style, Path.join(this.output_path, outname));
        }        
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