import { dir } from 'console';
import FS from 'fs';
import Path from 'path';

/**
 * Recursively retrieve a list of files from the specified directory.
 * @param {String} directory 
 * @returns An array of {fullpath, name} objects.
 */
 function getFiles(directory = ".", recursive = true){
      const dirEntries = FS.readdirSync(directory, { withFileTypes: true });
      let files = dirEntries.map((dirEntry) => {
          const resolved = Path.resolve(directory, dirEntry.name);

          if (recursive){
            return dirEntry.isDirectory() 
                ? getFiles(resolved, recursive) 
                : {fullpath : resolved, name : dirEntry.name};
          } else {
            return dirEntry.isDirectory() 
                ? []
                : {fullpath : resolved, name : dirEntry.name};
          }
      });

      files = files.flat();

      for (const record of files){
          record.relative = Path.relative(directory, record.fullpath);
      }

      return files;
  }

  export default getFiles;