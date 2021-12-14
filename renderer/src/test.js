import NidgetPreprocessor from "./NidgetPreprocessor.js";
import constants from "./constants.js";

const start = Date.now();
const nidgetPreprocessor = new NidgetPreprocessor();
nidgetPreprocessor.addNidgetPath(constants.NIDGET_PATH);
nidgetPreprocessor.addRootPath(constants.EJS_VIEW_DIR, constants.SCRIPT_SOURCE_DIR);
console.log(Date.now() - start);

for (const rec of nidgetPreprocessor.reverseLookup('nidget-button')){
    console.log(rec.toString());
}


