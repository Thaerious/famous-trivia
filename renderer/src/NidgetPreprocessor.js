import fs from "fs";
import { JSDOM } from "jsdom";
import Path from "path";
import getFiles from "./getFiles.js";
import Logger from "@thaerious/logger";
import {Parser} from "acorn";
import {bfsObject, bfsAll} from "./include/bfsObject.js";
import FS from "fs";

const logger = Logger.getLogger().channel("nidget_preprocessor");
Logger.getLogger().channel("nidget_preprocessor").prefix = (f, l, c) =>{
    return (`${f}:${l}\n`);
};

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
        this._dependencies = new Set();
        this._type = "nidget";
    }

    addDependency(record) {
        this._dependencies.add(record);
    }

    /* return a non-reflective set of dependency records */
    get dependencies() {
        const set = new Set();
        const stack = [this];

        while (stack.length > 0) {
            if (!set.has(stack[0])) {
                if (stack[0] !== this) set.add(stack[0]);
                for (const dep of stack[0]._dependencies) {
                    stack.push(dep);
                }
            }
            stack.shift();
        }
        return set;
    }

    get name() {
        return this._name;
    }
    get script() {
        return this._script;
    }
    get view() {
        return this._view;
    }
    set script(value) {
        this._script = value;
    }
    set view(value) {
        this._view = value;
    }
    set type(value) {
        this._type = value;
    }
    get type() {
        return this._type;
    }

    toString() {
        return (
            `NidgetRecord {\n` +
            `\tname : ${this.name}\n` +
            `\tscript : ${this.script}\n` +
            `\tview : ${this.view}\n` +
            `\ttype : ${this.type}\n` +
            `\tdependencies : Set(${this.dependencies.size}){\n` +
            [...this.dependencies].reduce((p, c) => `${p}\t\t${c.name}\n`, "") +
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
        const nidget_records = nidget_preprocessor.nidgetRecords;

        const file_string = fs.readFileSync(this.view);
        const html_string = `<html><body>${file_string}</body></html>`;
        const dom = new JSDOM(html_string);

        for (let nidget_name in nidget_records) {
            const record = nidget_records[nidget_name];
            if (this._dependencies.has(record)) continue;

            let template = dom.window.document.querySelector(`template`);
            if (template) {
                let includes = template.getAttribute("data-include") ?? "";
                let split = includes.split(/[ ,]+/g);

                for (let s of split) {
                    if (s.trim() != "") {
                        if (nidget_preprocessor.hasRecord(s.trim())){
                            this.addDependency(nidget_records[s.trim()]);
                        } else {
                            logger.warn(`warning: unknown nidget in data-include attribute: ${s.trim()}`);
                        }                        
                    }
                }

                if (template.content.querySelector(nidget_name)) {
                    this.addDependency(record);
                }
            } else {
                if (dom.window.document.querySelector(nidget_name)) {
                    this.addDependency(record);
                }
            }
        }
    }

    /**
     * Seek out JS dependencies in this record's script.
     * The dependency is not neccisarily a Nidget.
     */
    seekJSDependencies(nidget_preprocessor){
        if (this.script === "") return;
        if (!fs.existsSync(this.script)) return;  
                
        const code = FS.readFileSync(this.script);
        const ast = Parser.parse(code, {ecmaVersion: "latest", sourceType: "module"});        
        const import_declarations = bfsAll(ast, "type", "ImportDeclaration");
        const import_sources = bfsAll(import_declarations, "source");
        
        for (const import_source of import_sources){
            const name = import_source.source.value;
            if (nidget_preprocessor.hasRecord(name)){
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
        this.nidgetRecords = {};
    }

    addPath(...filepaths) {
        const jsFiles = [];
        const ejsFiles = [];

        for (let filepath of getFiles(...filepaths)) {
            if (filepath.endsWith(".ejs")) ejsFiles.push(filepath);
            if (filepath.endsWith(".js")) jsFiles.push(filepath);
        }

        for (let filepath of jsFiles){    
            if (this.hasRecord(filepath)) continue;
            if (isNidgetScript(filepath)) this.addNidget(filepath);
            else this.addInclude(filepath);            
        }

        for (let filepath of ejsFiles){            
            if (this.hasRecord(filepath)){
                this.getRecord(filepath).view = filepath;
                if (this.getRecord(filepath).type === "include") this.getRecord(filepath).type = "view";
            } else {
                this.addView(filepath);
            }            
        }

        for (const nidget in this.nidgetRecords) {
            this.nidgetRecords[nidget].seekEJSDependencies(this);
            this.nidgetRecords[nidget].seekJSDependencies(this);
        }

        return this;
    }

    getRecord(name) {
        if (this.nidgetRecords[name]) return this.nidgetRecords[name];
        return this.nidgetRecords[this.convertToDash(name)];
    }

    hasRecord(name){
        if (this.nidgetRecords[name]) return true;
        if (this.nidgetRecords[this.convertToDash(name)]) return true;
        return false;
    }

    get records() {
        const array = [];
        for (const name in this.nidgetRecords) {
            array.push(this.nidgetRecords[name]);
        }
        return array;
    }

    /**
     * Retrieve a non-reflective array of known Nidget names.
     */
    get directory() {
        const array = [];
        for (const name in this.nidgetRecords) {
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
            nidgetName = this.convertToDash(nidgetName);
        }

        return_set.add(this.getRecord(nidgetName));

        for (const parentName in this.nidgetRecords) {
            const parent = this.nidgetRecords[parentName];
            for (const child of parent.dependencies) {
                if (child.name === nidgetName) return_set.add(parent);
            }
        }

        return return_set;
    }

    addInclude(filepath) {
        const name = this.convertToDash(Path.parse(filepath).name);
        if (!this.nidgetRecords[name]) {
            this.nidgetRecords[name] = new DependencyRecord(name);
            this.nidgetRecords[name].type = "include";
            this.nidgetRecords[name].script = filepath;
        }
        return this.nidgetRecords[name];
    }

    addView(filepath) {
        const name = this.convertToDash(Path.parse(filepath).name);
        if (!this.nidgetRecords[name]) {
            this.nidgetRecords[name] = new DependencyRecord(name);
            this.nidgetRecords[name].type = "view";
            this.nidgetRecords[name].view = filepath;
        }
        return this.nidgetRecords[name];
    }

    addNidget(filepath) {    
        const name = this.validateNidgetName(Path.parse(filepath).name);        
        if (!this.nidgetRecords[name]) this.nidgetRecords[name] = new DependencyRecord(name);
        this.nidgetRecords[name].script = filepath;
        return this.nidgetRecords[name];
    }

    /**
     * Ensure that the nidget name is in the correct format.
     * The correct format consists of two or more dash (-) separated words.
     * Converts camelcase names to dash delimited names.
     * Converts underscore delimited to dash delimited.
     * @param nidgetName
     */
    validateNidgetName(nidgetName) {
        const ctdNidgetName = this.convertToDash(nidgetName);
        if (ctdNidgetName.indexOf("-") === -1) {
            throw new Error("Invalid nidget name: " + nidgetName);
        }
        return ctdNidgetName;
    }

    /**
     * Converts string to dash delimited.
     * @param string
     */
    convertToDash(string) {
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
        for (let nidget in this.nidgetRecords) {
            if (dom.window.document.querySelector(nidget)) {
                for (const dependent of this.nidgetRecords[nidget].dependencies) {
                    includes.add(dependent);
                }
            }
        }
        return includes;
    }
}

function isNidgetScript(filepath){
    const code = FS.readFileSync(filepath);
    let ast = Parser.parse(code, {ecmaVersion: "latest", sourceType: "module"});
    
    ast = bfsObject(ast, "type", "ClassDeclaration");
    return ast?.superClass?.name === "NidgetElement";
}

export default NidgetPreprocessor;
