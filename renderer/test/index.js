import NidgetPreprocessor from "../src/NidgetPreprocessor.js";

// console.log("new NidgetPreprocessor");
const nidget_preprocessor = new NidgetPreprocessor();

nidget_preprocessor.addPath("test/mock/nidgets/**");
nidget_preprocessor.addPath("test/mock/view", "test/mock/scripts", "test/mock/styles");

for (const record of nidget_preprocessor.records) console.log(record.toString());