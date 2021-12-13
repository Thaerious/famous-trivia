import FS from "fs";
import Logger from "@thaerious/logger";
import constants from "./constants.js";
import NidgetPreprocessor from "./NidgetPreprocessor.js";
import Path from "path";
import renderEJS from "./renderEJS.js";
import renderJS from "./RenderJS.js";
import Crypto from "crypto";

const logger = Logger.getLogger();

class Watcher {
    constructor(output_directory, ...source_directory) {
        this.output_directory = output_directory;
        this.source_directory = source_directory;
        this.blacklist = new Set();
        this.md5 = new Map();
        
        for (let dir of source_directory){
            let recursive = false;
            if (dir.endsWith("/**")){
                recursive = true;
                dir = dir.substring(0, dir.length - 3);
            }

            logger.channel("verbose").log(dir);
            FS.watch(dir, { recursive: true }, async (e, f) => await this.listener(dir, e, f));        
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
        nidget_preprocessor.addNidgetPath(constants.NIDGET_PATH);            
        nidget_preprocessor.addRootPath(constants.EJS_VIEW_DIR, constants.SCRIPT_SOURCE_DIR);       
        const parsed = Path.parse(filename);
        const dependents = nidget_preprocessor.reverseLookup(parsed.name); 
        
        for (const rec of dependents){
            if (rec.root && rec.script){             
                logger.channel("verbose").log(`browserify: ${rec.script}`);
                const outputPath = Path.join(this.output_directory, Path.parse(rec.script).name + ".js");
                
                try{
                    await renderJS(rec.script, rec.dependencies, outputPath);
                } catch (error){
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
        nidget_preprocessor.addNidgetPath(constants.NIDGET_PATH);            
        nidget_preprocessor.addRootPath(constants.EJS_VIEW_DIR, constants.SCRIPT_SOURCE_DIR);       
        const parsed = Path.parse(filename);
        const dependents = nidget_preprocessor.reverseLookup(parsed.name);

        for (const rec of dependents){
            if (rec.root){
                renderEJS(rec.view, rec.dependencies, this.output_directory);
            }
        }

        this.blacklist.delete(filename);
    }
}

new Watcher(constants.GENERATED_DIR, constants.EJS_VIEW_DIR, constants.SCRIPT_SOURCE_DIR, constants.NIDGET_PATH);
