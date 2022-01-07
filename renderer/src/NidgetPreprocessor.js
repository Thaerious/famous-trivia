import fs from "fs";
import { JSDOM } from "jsdom";
import Path from "path";
import Logger from "@thaerious/logger";
import { Parser } from "acorn";
import { bfsObject, bfsAll } from "./include/bfsObject.js";
import FS from "fs";
import glob_fs from "glob-fs";

class Warn {
    constructor() {
        this.previous = new Set();
    }

    warn(file, nidget) {
        if (this.previous.has(`${file}:${nidget}`)) return;
        this.previous.add(`${file}:${nidget}`);
        logger.warn(`warning: unknown data-include ${nidget} in ${file}`);
    }
}
const warner = new Warn();
const logger = Logger.getLogger();
// Logger.getLogger().channel("nidget_preprocessor").prefix = (f, l, c) => {
//     return `${f}:${l}\n`;
// };

/**
 * A record object for a single Nidget or root file.
 * It may or may not have an associated script file or view file (must have at least one of them).
 * All nidgets that this nidget refrences are considered dependencies.
 */
class DependencyRecord {
    constructor(nidgetName) {
        this._name = nidgetName;
        this._script = undefined;
        this._view = undefined;
        this._style = undefined;
        this._dependents = new Set();
        this._parents = new Set();
        this._type = "nidget";
    }

    addDependency(record) {
        this._dependents.add(record);
        record._parents.add(this);
    }

    get parents() {
        const set = new Set();
        const stack = [this];

        while (stack.length > 0) {
            const current = stack.shift();
            for (const parent of current._parents) {
                if (!set.has(parent)) {
                    set.add(parent);
                    stack.push(parent);
                }
            }
        }
        return set;
    }

    /* return a non-reflective set of dependency records */
    get dependents() {
        const set = new Set();
        const stack = [this];

        while (stack.length > 0) {
            const current = stack.shift();
            if (!set.has(current)) {
                set.add(current);
                for (const dep of current._dependents) {
                    stack.push(dep);
                }
            }
        }
        set.delete(this);
        return set;
    }

    get name() {
        return this._name;
    }
    get script() {
        return this._script;
    }
    set script(value) {
        if (typeof value !== "string") throw new Error(`expected string found ${typeof value}`);
        this._script = value;
    }
    get view() {
        return this._view;
    }
    set view(value) {
        if (typeof value !== "string") throw new Error(`expected string found ${typeof value}`);
        this._view = value;
    }
    set type(value) {
        if (typeof value !== "string") throw new Error(`expected string found ${typeof value}`);
        this._type = value;
    }
    get type() {
        return this._type;
    }
    get style() {
        return this._style;
    }
    set style(value) {
        if (typeof value !== "string") throw new Error(`expected string found ${typeof value}`);
        this._style = value;
    }

    toString() {
        return (
            `NidgetRecord {\n` +
            `\tname : ${this.name}\n` +
            `\tscript : ${this.script}\n` +
            `\tview : ${this.view}\n` +
            `\tstyle : ${this.style}\n` +
            `\ttype : ${this.type}\n` +
            `\tdependents : Set(${this.dependents.size}){\n` +
            [...this.dependents].reduce((p, c) => `${p}\t\t${c.name}\n`, "") +
            `\tparents : Set(${this.parents.size}){\n` +
            [...this.parents].reduce((p, c) => `${p}\t\t${c.name}\n`, "") +
            `\t}\n`
        );
    }

    /**
     * Get all dependencies for a single nidget ejs file.
     *
     * Adds any dependencies in the data-include attribute of the template (comma or space delimited).
     * Then searches for any tag-names that match any .ejs files in the nidgets subdirectory.
     */
    seekEJSDependencies(nidget_preprocessor) {
        if (this.view === "") return;
        if (!fs.existsSync(this.view)) return;

        const file_string = fs.readFileSync(this.view);
        const html_string = `<html><body>${file_string}</body></html>`;
        const dom = new JSDOM(html_string);

        let template = dom.window.document.querySelector(`template`);
        if (template) {
            let includes = template.getAttribute("data-include") ?? "";
            let split = includes.split(/[ ,]+/g);

            for (let s of split) {
                const dependency_name = s.trim();
                if (dependency_name != "") {
                    if (nidget_preprocessor.hasRecord(dependency_name)) {
                        const record = nidget_preprocessor.getRecord(dependency_name);
                        this.addDependency(record);
                    } else {
                        warner.warn(this.name, s.trim());
                    }
                }
            }
        }

        for (let record of nidget_preprocessor.records) {
            if (this._dependents.has(record)) continue;

            if (template?.content.querySelector(record.name) || dom.window.document.querySelector(record.name)) {
                this.addDependency(record);
            }
        }
    }

    /**
     * Seek out JS dependencies in this record's script.
     * The dependency is not neccesarily a Nidget.
     */
    seekJSDependencies(nidget_preprocessor) {
        if (this.script === "") return;
        if (!fs.existsSync(this.script)) return;

        const code = FS.readFileSync(this.script);
        const ast = Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" });
        const import_declarations = bfsAll(ast, "type", "ImportDeclaration");
        const import_sources = bfsAll(import_declarations, "source");

        for (const import_source of import_sources) {
            const name = import_source.source.value;
            if (!name.endsWith(".js")) continue;
            if (nidget_preprocessor.hasRecord(name)) {
                this.addDependency(nidget_preprocessor.getRecord(name));
            } else {
                const record = nidget_preprocessor.addInclude(import_source.source.value);
                this.addDependency(record);
            }
        }
    }
}

/**
 * Creates lists of .js dependencies from nidget .ejs files.
 */
class NidgetPreprocessor {
    constructor() {
        this.nidget_records = {};
        this.input_paths = [];
        this.exclude_paths = [];
    }

    addPath(...filepaths) {
        Logger.getLogger()
            .channel("verbose")
            .log("adding filepath " + filepaths);
        this.input_paths = [...this.input_paths, ...filepaths];
    }

    addExclude(...filepaths) {
        this.exclude_paths = [...this.exclude_paths, ...filepaths];
    }

    process() {
        Logger.getLogger().channel("debig").log("# NPP process");

        this.nidget_records = {};

        const jsFiles = [];
        const ejsFiles = [];
        const scssFiles = [];

        for (const input_path of this.input_paths) {
            const glob = glob_fs();

            for (const exclude_path of this.exclude_paths) {
                const resolved_exclude_path = Path.resolve(exclude_path);

                glob.use(file => {
                    if (file.path.indexOf(resolved_exclude_path) == 0) {
                        logger.channel("debug").log(`excluded ${file.path}`);
                        file.exclude = true;
                    } else {
                        logger.channel("debug").log(`included ${file.path}`);
                    }
                    return file;
                });
            }

            for (const filepath of glob.readdirSync(input_path)) {
                if (filepath.endsWith(".ejs")) ejsFiles.push(filepath);
                if (filepath.endsWith(".js")) jsFiles.push(filepath);
                if (filepath.endsWith(".scss")) scssFiles.push(filepath);
            }
        }

        try {
            for (let filepath of jsFiles) {
                if (this.hasRecord(filepath)) {
                    this.getRecord(filepath).script = filepath;
                    if (this.isNidgetScript(filepath)) this.getRecord.type = "nidget";
                }

                if (this.isNidgetScript(filepath)) this.addNidget(filepath);
                else this.addInclude(filepath);
            }
        } catch (err) {
            console.log("*** JS Parsing Error:");
            console.log(`\t${err.message}`);
        }

        for (let filepath of ejsFiles) {
            if (this.hasRecord(filepath)) {
                this.getRecord(filepath).view = filepath;
                if (this.getRecord(filepath).type === "include") this.getRecord(filepath).type = "view";
            } else {
                this.addView(filepath);
            }
        }

        for (let filepath of scssFiles) {
            if (!this.hasRecord(filepath)) this.addStyle(filepath);
            else this.getRecord(filepath).style = filepath;
        }

        for (const nidget in this.nidget_records) {
            this.nidget_records[nidget].seekEJSDependencies(this);
            this.nidget_records[nidget].seekJSDependencies(this);
        }

        return this;
    }

    getRecord(name) {
        if (this.nidget_records[name]) return this.nidget_records[name];
        return this.nidget_records[NidgetPreprocessor.convertToDash(name)];
    }

    hasRecord(name) {
        if (this.nidget_records[name]) return true;
        if (this.nidget_records[NidgetPreprocessor.convertToDash(name)]) return true;
        return false;
    }

    get records() {
        const array = [];
        for (const name in this.nidget_records) {
            array.push(this.nidget_records[name]);
        }
        return array;
    }

    /**
     * Retrieve a non-reflective array of known Nidget names.
     */
    get directory() {
        const array = [];
        for (const name in this.nidget_records) {
            array.push(name);
        }
        return array;
    }

    /**
     * Retrieve a non-reflective set nidgets that depend on a nidget
     */
    reverseLookup(nidgetName) {
        if (!this.getRecord(nidgetName)) throw new Error(`Unknown Nidget: ${nidgetName}`);
        const return_set = new Set();

        if (this.getRecord(nidgetName).type === "nidget") {
            nidgetName = NidgetPreprocessor.convertToDash(nidgetName);
        }

        return_set.add(this.getRecord(nidgetName));

        for (const parentName in this.nidget_records) {
            const parent = this.nidget_records[parentName];
            for (const child of parent.dependencies) {
                if (child.name === nidgetName) return_set.add(parent);
            }
        }

        return return_set;
    }

    addStyle(filepath) {
        const name = NidgetPreprocessor.convertToDash(Path.parse(filepath).name);
        if (!this.nidget_records[name]) {
            this.nidget_records[name] = new DependencyRecord(name);
            this.nidget_records[name].type = "include";
            this.nidget_records[name].style = filepath;
        }
        return this.nidget_records[name];
    }

    addInclude(filepath) {
        const name = NidgetPreprocessor.convertToDash(Path.parse(filepath).name);
        if (!this.nidget_records[name]) {
            this.nidget_records[name] = new DependencyRecord(name);
            this.nidget_records[name].type = "include";
            this.nidget_records[name].script = filepath;
        }
        return this.nidget_records[name];
    }

    addView(filepath) {
        const name = NidgetPreprocessor.convertToDash(Path.parse(filepath).name);
        if (!this.nidget_records[name]) {
            this.nidget_records[name] = new DependencyRecord(name);
            this.nidget_records[name].type = "view";
            this.nidget_records[name].view = filepath;
        }
        return this.nidget_records[name];
    }

    addNidget(filepath) {
        const name = this.validateNidgetName(Path.parse(filepath).name);
        if (!this.nidget_records[name]) this.nidget_records[name] = new DependencyRecord(name);
        this.nidget_records[name].script = filepath;
        return this.nidget_records[name];
    }

    /**
     * Ensure that the nidget name is in the correct format.
     * The correct format consists of two or more dash (-) separated words.
     * Converts camelcase names to dash delimited names.
     * Converts underscore delimited to dash delimited.
     * @param nidgetName
     */
    validateNidgetName(nidgetName) {
        const ctdNidgetName = NidgetPreprocessor.convertToDash(nidgetName);
        if (ctdNidgetName.indexOf("-") === -1) {
            throw new Error("Invalid nidget name: " + nidgetName);
        }
        return ctdNidgetName;
    }

    /**
     * Converts string to dash delimited.
     * @param string
     */
    static convertToDash(string) {
        string = Path.parse(string).name;
        string = string.charAt(0).toLocaleLowerCase() + string.substr(1); // leading lower case
        string = string.replace(/_+/g, "-"); // replace underscore with dash
        string = string.replace(/ +/g, "-"); // replace space with dash
        string = string.replace(/-([A-Z]+)/g, "$1"); // normalize dash-capital to capital
        return string.replace(/([A-Z]+)/g, "-$1").toLowerCase(); // change all upper to lower and add a dash
    }

    /**
     * Given a template (.ejs) file retrieve all nidgets it depends on.
     * Searches the template for for any instance of a nidget element.
     * @param filePath
     * @returns {Set<DependencyRecord>}
     */
    getDependencies(filePath) {
        const fileString = fs.readFileSync(filePath);
        const dom = new JSDOM(fileString);

        let includes = new Set();
        for (let nidget in this.nidget_records) {
            if (dom.window.document.querySelector(nidget)) {
                for (const dependent of this.nidget_records[nidget].dependencies) {
                    includes.add(dependent);
                }
            }
        }
        return includes;
    }

    isNidgetScript(filepath) {
        const code = FS.readFileSync(filepath);
        let ast = null;

        try {
            ast = Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" });
        } catch (err) {
            throw new Error(`${err.message} in ${filepath}`);
        }

        ast = bfsAll(ast, "type", "ClassDeclaration");
        const name = NidgetPreprocessor.convertToDash(filepath);

        for (const node of ast) {
            const class_name = node.id.name;
            if (class_name === "NidgetElement") return true;
            if (node?.superClass?.name) {
                const super_name = node.superClass.name;
                if (name !== NidgetPreprocessor.convertToDash(class_name)) continue;
                if (this.getRecord(super_name)?.type === "nidget") return true;
            }
        }

        return false;
    }
}

export default NidgetPreprocessor;
