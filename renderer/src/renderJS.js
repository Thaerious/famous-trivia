import browserify from "browserify";
import FS from "fs";
import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

function renderJS(sourcePath, nidgetDependencies, outputPath){
    return new Promise((resolve, reject) => {
        const b = browserify({ debug: true });   
        b.add(sourcePath);

        for (let record of nidgetDependencies) {
            logger.channel("very-verbose").log(`JS Dependency: ${record.script}`);
            b.add(record.script);
        }

        b.transform("babelify");
        const rs = b.bundle();
        logger.channel("verbose").log(``);
        
        const stream = FS.createWriteStream(outputPath);
        stream.write("// generated by EJSRender on " + new Date().toLocaleString() + "\n");  

        rs.on('error', err => {
            reject(err);
            if (stream?.emit) stream.emit('end'); 
        });
        
        rs.pipe(stream);
        
        // wait for the write-stream to finish writing
        stream.on('finish', ()=>{
            stream.close();
            resolve();
        });     
    });
}

export default renderJS;
