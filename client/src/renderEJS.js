import ejs from "ejs";
import Path from "path";
import FS from "fs";

function renderEJS(sourceFullpath, nidgetDependencies, outputDirectory){
    const basename = Path.basename(sourceFullpath.slice(0, -4));
    
    ejs.renderFile(
        sourceFullpath,
        {
            filename: basename,
            nidget_records : nidgetDependencies
        },
        (err, str)=>{
            if (err) console.log(err);
            if (!FS.existsSync(outputDirectory)){
                 FS.mkdirSync(outputDirectory, {recursive : true});
            }
            FS.writeFileSync(Path.join(outputDirectory, basename + ".html"), str);
        }
    );
};

export default renderEJS;