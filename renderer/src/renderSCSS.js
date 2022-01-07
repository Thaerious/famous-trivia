import sass from "sass";
import FS from "fs";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

function renderSCSS(sourcePath, outputPath){
    logger.channel("very-verbose").log(`  \\_ ${sourcePath} ${outputPath}`);
    
    try{
        const result = sass.compile(sourcePath);
        if (result) FS.writeFileSync(outputPath, result.css);
    } catch (error){
        throw error;
    }
}

export default renderSCSS;