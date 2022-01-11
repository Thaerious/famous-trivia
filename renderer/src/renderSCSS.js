import sass from "sass";
import FS from "fs";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

function renderSCSS (sourcePath, outputPath) {
    logger.channel(`very-verbose`).log(`  \\_ ${sourcePath} ${outputPath}`);
    const result = sass.compile(sourcePath);
    if (result) FS.writeFileSync(outputPath, result.css);
}

export default renderSCSS;
