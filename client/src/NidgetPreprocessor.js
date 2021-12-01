import fs from "fs";
import { JSDOM } from "jsdom";
import Path from "path";

class NidgetRecord {
    constructor(nidgetName) {
        this._name = nidgetName;
        this._script = undefined;
        this._view = undefined;
        this._dependencies = new Set();
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
                set.add(stack[0]);
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

    /**
     * Get all dependencies from a nidget ejs file.
     * Adds any dependencies in the data-include attribute of the template (comma or space delimited).
     * Then searches for any tag-names that match any .ejs files in views/nidgets.
     * @param filename
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

            const template = dom.window.document.querySelector(`template`);

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
        }
    }
}

/**
 * Creates lists of .js dependencies from nidget .ejs files.
 */
class NidgetPreprocessor {
    /**
     * @param (String) templateFilePath location of the template (.ejs) files.
     * @param (String) scriptFilePath location of the script (.js) files.
     */
    constructor() {
        this.nidgetRecords = {};
    }

    /**
     * Look at all files in the module path to determine which nidgets will
     * be used.  Lists of nidget (js) dependencies are placed in the
     * 'knownNidgets' field.
     * @returns {NidgetPreprocessor}
     */
    setup(templateFilePath, scriptFilePath) {
        this.templateFilePath = templateFilePath;
        this.scriptFilePath = scriptFilePath;

        /** look through .ejs files to identify nidgets  */
        for (let file of fs.readdirSync(this.templateFilePath)) {
            let nidgetName = file.substr(0, file.length - 4); // .ejs
            const record = this.addNidget(nidgetName);
            record.view = Path.join(this.templateFilePath, file);
        }

        /** look through .js files to identify nidgets  */
        for (const file of fs.readdirSync(this.scriptFilePath)) {
            const nidgetName = file.substr(0, file.length - 3); // .js
            const record = this.addNidget(nidgetName);
            record.script = Path.join(this.scriptFilePath, file);
        }

        for (const nidget in this.nidgetRecords) {
            this.nidgetRecords[nidget].seekDependencies(this.nidgetRecords);
        }

        return this;
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
     * Converts camelCase to dash delimited.
     * @param string
     */
    convertToDash(string) {
        const llcString = string.charAt(0).toLocaleLowerCase() + string.substr(1); // leading lower case
        return llcString.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    /**
     * Retrieve only the dependencies that have a template file.
     * This is used by the ejs renderer to determine which template files to include.
     * Browserify uses 'getDependencies' as it returns all dependencies.
     * @param filePath
     */
    getTemplateDependencies(filePath) {
        let includes = new Set();
        for (const dep of this.getDependencies(filePath)) {
            if (this.ejsNidgets.has(dep)) {
                includes.add(dep);
            }
        }
        return includes;
    }

    /**
     * Retrieve the dependencies for a specific template (.ejs) file.
     * Searches the template for for any instance of a nidget element.
     * Nidgets elements are those that declared in in the nidget template
     * path (/view/nidgets) or in the nidget script path (/src/client/nidgets).
     * @param filePath
     * @returns {Set<any>}
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
