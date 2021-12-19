import { dir } from "console";
import FS from "fs";
import Path from "path";

/**
 * Recursively retrieve a list of files from the specified directory.
 * @param {String} directory
 * @returns An array of {fullpath, name} objects.
 */
function getFiles(...directories) {
    let return_files = [];
    
    for (let directory of directories) {
        let recursive = false;

        if (directory.endsWith("/**")) {
            recursive = true;
            directory = directory.substring(0, directory.length - 3);
        }

        const dirEntries = FS.readdirSync(directory, { withFileTypes: true });
        let files = dirEntries.map(dirEntry => {
            const joined_path = Path.join(directory, dirEntry.name);

            if (recursive) {
                return dirEntry.isDirectory() ? getFiles(joined_path) : joined_path;
            } else {
                return dirEntry.isDirectory() ? [] : joined_path;
            }
        });

        return_files.push(files.flat());
    }
    return return_files.flat();
}

export default getFiles;
