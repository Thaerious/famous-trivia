import sass from "sass";
import FS from "fs";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

function renderSCSS(sourcePath, outputPath){
    logger.channel("verbose").log(`# render scss: ${sourcePath}`);
    const result = sass.compile(sourcePath);
    FS.writeFileSync(outputPath, result.css);
}

export default renderSCSS;