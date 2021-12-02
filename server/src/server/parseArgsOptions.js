export default {
    flags: [
        {
            long: "help",
            short: "h",
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
        {
            long: "port",
            short: "p",
            default: 8000,
        }
    ],
};
