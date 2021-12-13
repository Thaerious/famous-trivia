import fs from "fs";
import { JSDOM } from "jsdom";
import Path from "path";
import getFiles from "./getFiles.js";

/**
 * A record object for a single Nidget.
 * It may or may not have an associated script file or view file (must have at least one of them).
 * All nidgets that this nidget refrences are considered dependencies.
 */
class NidgetRecord {
    constructor(nidgetName) {
        this._name = nidgetName;
        this._script = undefined;
        this._view = undefined;
        this._dependencies = new Set();
        this._root = false;
    }

    addDependency(record) {
        this._dependencies.add(record);
    }

    /* return a non-reflective set of dependency records */
    get dependencies(){
        const set = new Set();
        const stack = [this];
        
        while(stack.length > 0){
            if (!set.has(stack[0])){
                if (stack[0] !== this) set.add(stack[0]);
                for (const dep of stack[0]._dependencies){
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
    set root(value) {
        this._root = value;
    }
    get root() {
        return this._root;
    }    

    toString(){        
        return `NidgetRecord {\n` + 
               `\tname : ${this.name}\n` + 
               `\tscript : ${this.script}\n` + 
               `\tview : ${this.view}\n` + 
               `\troot : ${this.root}\n` + 
               `\tdependencies : Set(${this.dependencies.size}){\n` + 
               [...this.dependencies].reduce((p, c)=> `${p}\t\t${c.name}\n`, "") +
               `\t}\n`;
    }

    /**
     * Get all dependencies for a single nidget ejs file.
     * 
     * Adds any dependencies in the data-include attribute of the template (comma or space delimited).
     * Then searches for any tag-names that match any .ejs files in the nidgets subdirectory.
     */
    seekDependencies(nidgetRecords) {
        if (this.view === "") return;
        if (!fs.existsSync(this.view)) return;

        const fileString = fs.readFileSync(this.view);
        const htmlString = `<html><body>${fileString}</body></html>`;
        const dom = new JSDOM(htmlString);

        for (let nidgetName in nidgetRecords) {
            const record = nidgetRecords[nidgetName];
            if (this._dependencies.has(record)) continue;

            let template = dom.window.document.querySelector(`template`);
            if (template){
                let includes = template.getAttribute("data-include") ?? "";
                let split = includes.split(/[ ,]+/g);

                for (let s of split) {
                    if (s.trim() != "") {
                        this._dependencies.add(nidgetRecords[s.trim()]);
                    }
                }
                
                if (template.content.querySelector(nidgetName)) {
                    this._dependencies.add(record);
                }
            } else {
                if (dom.window.document.querySelector(nidgetName)) {
                    this._dependencies.add(record);
                }
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

    /**
     * Look at all files in the module path to determine which nidgets will
     * be used.  Lists of nidget (js) dependencies are placed in the
     * 'knownNidgets' field.
     * @returns {NidgetPreprocessor}
     */
    addNidgetPath(...filepaths) {
        return this.addPath(filename=>this.addNidget(filename), ...filepaths);
    }

    addRootPath(...filepaths) {
        return this.addPath(filename=>this.addRoot(filename), ...filepaths);
    }

    addPath(addRecordCB, ...filepaths){
        for (let filepath of filepaths){
            let recursive = false;
            if (filepath.endsWith("/**")){
                recursive = true;
                filepath = filepath.substring(0, filepath.length - 3);
            }

            /** look through .ejs files to identify nidgets */
            for (let fileRecord of getFiles(filepath, recursive)) {
                const filename = fileRecord.name;
                if (!filename.endsWith(".ejs") && !filename.endsWith(".js")) continue;

                const record = addRecordCB(filename.substring(0, filename.lastIndexOf(".")));

                if (filename.endsWith(".ejs"))     record.view = Path.join(filepath, fileRecord.relative);
                else if (filename.endsWith(".js")) record.script = Path.join(filepath, fileRecord.relative);       
            }

            for (const nidget in this.nidgetRecords) {
                this.nidgetRecords[nidget].seekDependencies(this.nidgetRecords);
            }
        }

        return this;        
    }

    getRecord(name){
        if (this.nidgetRecords[name]) return this.nidgetRecords[name];
        return this.nidgetRecords[this.convertToDash(name)];
    }

    /**
     * Retrieve a non-reflective array of known Nidget names.
     */
    get directory(){
        const array = [];
        for (const name in this.nidgetRecords) {
            array.push(name);
        }
        return array;
    }

    /**
     * Retrieve a non-reflective set nidgets that depend on a nidget
     */
    reverseLookup(nidgetName){
        if (!this.getRecord(nidgetName)) throw new Error(`Unknown Nidget: ${nidgetName}`);
        const return_set = new Set();

        if (this.getRecord(nidgetName).root === false){
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

    addRoot(name) {
        if (!this.nidgetRecords[name]){
             this.nidgetRecords[name] = new NidgetRecord(name);
             this.nidgetRecords[name].root = true;
        }
        return this.nidgetRecords[name];
    }

    addNidget(name) {
        name = this.validateNidgetName(name);
        if (!this.nidgetRecords[name]) this.nidgetRecords[name] = new NidgetRecord(name);
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
        string = string.charAt(0).toLocaleLowerCase() + string.substr(1); // leading lower case
        string = string.replace(/_+/g, "-"); // replace underscore with dash
        string = string.replace(/ +/g, "-"); // replace space with dash
        return string.replace(/([A-Z]+)/g, "-$1").toLowerCase(); // change all upper to lower and add a dash
    }

    /**
     * Given a template (.ejs) file retrieve all nidgets it depends on.
     * Searches the template for for any instance of a nidget element.
     * @param filePath
     * @returns {Set<NidgetRecord>}
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

export default NidgetPreprocessor;
