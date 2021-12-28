import constants from "./constants.js";

export default {
    flags: [{
        "long" : "verbose",
        "short" : "v",
        "type" : "boolean"
    },{
        "long" : "silent",
        "short" : "s",
        "type" : "boolean"
    },{
        "long" : "destination",
        "short" : "d",
        "type" : "string"
    },{
        "long" : "watch",
        "short" : "w",
        "type" : "boolean"
    },{
    "long" : "name",
    "short" : "n",
    "type" : "string"
    }]
}