export default {
    flags: [
        {
            long: "help",
            short: "h",
            type : "boolean",
        },
        {
            long: "render",
            short: "r",
            type : "boolean",
        },
        {
            long: "jit",
            short: "j",
            type : "boolean",
        },
        {
            long: "browserify",
            short: "b",
            type : "boolean",
        },
        {
            long: "interactive",
            short: "i",
            type : "boolean",
        },
        {
            long: "verbose",
            short: "v",
            default: false,
            type : "boolean",
        },   
        {
            long: "start",
            short: "s",
            default: false,
            type : "boolean",
        },              
    ],
};
