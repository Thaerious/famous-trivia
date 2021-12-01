import NidgetPreprocessor from "./NidgetPreprocessor.js";
import constants from "./constants.js";
import renderEJS from "./renderEJS.js";
import RenderJS from "./RenderJS.js";
import FS from "fs";
import Path from "path";

const nidgetPreprocessor = new NidgetPreprocessor();
nidgetPreprocessor.setup(constants.NIDGET_VIEW_PATH, constants.NIDGET_SCRIPT_PATH);

FS.readdirSync(constants.EJS_VIEW_DIR, { withFileTypes: true })
    .filter(dirEntry => !dirEntry.isDirectory())
    .filter(dirEntry => dirEntry.name.endsWith(".ejs"))
    .map(dirEntry => Path.resolve(constants.EJS_VIEW_DIR, dirEntry.name))
    .forEach(async fullpath => {
        console.log(fullpath);
        const dep = nidgetPreprocessor.getDependencies(fullpath);
        renderEJS(fullpath, dep, constants.GENERATED_HTML_DIR);
        const jsPath = Path.join(constants.GENERATED_SCRIPT_DIR, Path.basename(fullpath, ".ejs") + ".js");

        try {
            await new RenderJS(dep).renderSync(jsPath);
        } catch (err) {
            console.log("ERROR");
            console.log(err.toString());
        }
    });
