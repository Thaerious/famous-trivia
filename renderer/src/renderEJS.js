import ejs from "ejs";
import Path from "path";
import FS from "fs";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

function renderEJS (sourceFullpath, nidgetDependencies, outputDirectory) {
    const basename = Path.basename(sourceFullpath.slice(0, -4));
    logger.channel(`very-verbose`).log(`  \\_ ${sourceFullpath}`);

    ejs.renderFile(
        sourceFullpath,
        {
            filename: basename,
            nidget_records: nidgetDependencies
        },
        (err, str) => {
            if (err) {
                console.log(err);
            } else {
                if (!FS.existsSync(outputDirectory)) {
                    FS.mkdirSync(outputDirectory, { recursive: true });
                }
                FS.writeFileSync(Path.join(outputDirectory, basename + `.html`), str);
            }
        }
    );
}

export default renderEJS;
