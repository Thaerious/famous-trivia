import sass from "sass";
import FS from "fs";

function renderSCSS(sourcePath, outputPath){
    const result = sass.compile(sourcePath);
    FS.writeFileSync(outputPath, result.css);
}

export default renderSCSS;