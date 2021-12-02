import NidgetPreprocessor from "./NidgetPreprocessor.js";
import constants from "./constants.js";
import renderEJS from "./renderEJS.js";
import RenderJS from "./RenderJS.js";
import FS from "fs";
import Path from "path";

const nidgetPreprocessor = new NidgetPreprocessor();
nidgetPreprocessor.setup(constants.NIDGET_VIEW_PATH, constants.NIDGET_SCRIPT_PATH);

/**
 * Browserify / Babelify
 * 
 * for each file in the view directory that ends in .ejs:
 *   (1) add all dependencies found by the nidget preprocessor
 *   (2) render the .html file from .ejs and write to the output directory
 *   (3) if a .js with a matching basename exists in the scripts directory add it
 *   (4) write the packed .js file to the generated output directory
 */ 
FS.readdirSync(constants.EJS_VIEW_DIR, { withFileTypes: true })
    .filter(dirEntry => !dirEntry.isDirectory())
    .filter(dirEntry => dirEntry.name.endsWith(".ejs"))
    .map(dirEntry => Path.resolve(constants.EJS_VIEW_DIR, dirEntry.name)) // convert to fullpath        
    .forEach(async fullpath => {
        console.log(fullpath);
        const dep = nidgetPreprocessor.getDependencies(fullpath); // (1)
        renderEJS(fullpath, dep, constants.GENERATED_HTML_DIR);   // (2)
        const jsPath = Path.join(constants.GENERATED_SCRIPT_DIR, Path.basename(fullpath, ".ejs") + ".js");

        const renderJS = new RenderJS(dep);        
        const rootJSPath = Path.join(constants.SCRIPT_SOURCE_DIR, Path.basename(fullpath, ".ejs") + ".js");        
        if (FS.existsSync(rootJSPath)){
            renderJS.addPath(rootJSPath); // (3)
        }        

        try {
            await renderJS.renderSync(jsPath); // (4)
        } catch (err) {
            console.log("ERROR: " + jsPath);
            console.log(err.toString());
        }
    });
