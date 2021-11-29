import fs from 'fs';
import {JSDOM} from 'jsdom';
import constants from "../../config.js";

/**
 * Creates lists of .js dependencies from nidget .ejs files.
 */
class NidgetPreprocessor {

    /**
     *
     * @param (String) templateFilePath location of the template (.ejs) files.
     * @param (String) scriptFilePath location of the script (.js) files.
     */
    constructor(templateFilePath, scriptFilePath) {
        this.templateFilePath = templateFilePath;
        this.scriptFilePath = scriptFilePath;

        this.knownNidgets = {};
        this.ejsNidgets = new Set(); // nidgets found in the template .ejs directory
    }

    identifyNidget(nidgetName) {
        nidgetName = this.validateNidgetName(nidgetName);
        this.knownNidgets[nidgetName] = {
            dependencies: new Set()
        }
    }

    /**
     * Look at all files in the module path to determine which nidgets will
     * be used.  Lists of nidget (js) dependencies are placed in the
     * 'knownNidgets' field.
     * @returns {NidgetPreprocessor}
     */
    setup(){
        /** look through .ejs files to identify nidgets (in templateFilePath directory)  */
        for (let file of fs.readdirSync(this.templateFilePath)){
            let nidgetName = file.substr(0, file.length - 4); // .ejs
            this.identifyNidget(nidgetName);
            this.ejsNidgets.add(nidgetName);
        }

        /** look through .js files to identify nidgets (in templateFilePath directory)  */
        for (let file of fs.readdirSync(this.scriptFilePath)){
            let nidgetName = file.substr(0, file.length - 3); // .js
            this.identifyNidget(nidgetName);
        }

        for (let nidget in this.knownNidgets){
            this.knownNidgets[nidget].dependencies.add(nidget); // add self
            let filePath = this.templateFilePath + "/" + nidget + ".ejs";
            this.seekDependencies(filePath, this.knownNidgets[nidget].dependencies);
        }

        return this;
    }

    /**
     * Ensure that the nidget name is in the correct format.
     * The correct format consists of two or more dash (-) separated words.
     * Will attempt to convert camelCase to dash delimited.
     * Converts camelcase names to dash delimited names.
     * @param nidgetName
     */
    validateNidgetName(nidgetName){
        const ctdNidgetName = this.convertToDash(nidgetName);
        if (ctdNidgetName.indexOf("-") === -1){
            throw new Error("Invalid nidget name: " + nidgetName);
        }
        return ctdNidgetName;
    }

    /**
     * Converts camelCase to dash delimited.
     * @param string
     */
    convertToDash(string){
        const llcString = string.charAt(0).toLocaleLowerCase() + string.substr(1); // leading lower case
        return llcString.replace( /([A-Z])/g, '-$1' ).toLowerCase();
    }

    /**
     * Retrieve only the dependencies that have a template file.
     * This is used by the ejs renderer to determine which template files to include.
     * Browserify uses 'getDependencies' as it returns all dependencies.
     * @param filePath
     */
    getTemplateDependencies(filePath){
        let includes = new Set();
        for (const dep of this.getDependencies(filePath)){
            if (this.ejsNidgets.has(dep)){
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
    getDependencies(filePath){
        const fileString = fs.readFileSync(filePath);
        const dom = new JSDOM(fileString);

        let includes = new Set();
        for (let nidget in this.knownNidgets){
            if (dom.window.document.querySelector(nidget)){
                for(const dependent of this.knownNidgets[nidget].dependencies) {
                    includes.add(dependent);
                }
            }
        }
        return includes;
    }

    /**
     * Get all dependencies from a nidget ejs file.
     * Adds any dependencies in the data-include attribute of the template (comma or space delimited).
     * Then searches for any tag-names that match any .ejs files in views/nidgets.
     * @param filename
     */
    seekDependencies(filePath, set){
        if (!fs.existsSync(filePath)) return;

        const fileString = fs.readFileSync(filePath);
        const htmlString = `<html><body>${fileString}</body></html>`;
        const dom = new JSDOM(htmlString);

        for (let nidget in this.knownNidgets){
            if (set.has(nidget)) continue;

            const template = dom.window.document.querySelector(`template`);

            let includes = template.getAttribute("data-include") ?? "";
            let split = includes.split(/[ ,]+/g);
            for (let s of split) if (s.trim() != "") set.add(s.trim());

            if (template.content.querySelector(nidget)){
                set.add(nidget);
                let childFilePath = this.templateFilePath + "/" + nidget + ".ejs";
                this.seekDependencies(childFilePath, set);
            }
        }
    }
}

function getScriptName(nidget){
    if (fs.existsSync(constants.nidgets.SCRIPT_PATH + nidget + ".js")){
        return constants.nidgets.SCRIPT_PATH + nidget + ".js";
    }

    let split = nidget.split("-");
    for (let i = 0; i < split.length; i++) {
        split[i] = split[i].charAt(0).toUpperCase() + split[i].slice(1);
    }

    let path = constants.nidgets.SCRIPT_PATH + (split.join('')) + ".js";
    if (fs.existsSync(path)){
        return path;
    }

    throw new Error("Nidget Script File Not Found for '" + nidget + "' :" + path);
}

export default NidgetPreprocessor;