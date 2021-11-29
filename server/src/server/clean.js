import fs from "fs";
import config from "../config.js";


/**
 * Remove all JIT script files.
 * Remove all EJS rendered files.
 * Remove all directories listed in config.clean_dir
 */
function clean(){
    for (let dir of config.clean_dir){
        if (fs.existsSync(dir)){
            const len = fs.readdirSync(dir).length;
            console.log("removing " + dir + ", files removed: " + len);
            fs.rmdirSync(dir, { recursive: true});
        } else {
            console.log("skipped " + dir);
        }
    }
}

export default clean;