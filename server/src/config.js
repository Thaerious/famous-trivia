const config = {
    google : {
        // The Browser API key obtained from the Google API Console.
        developerKey : 'AIzaSyABcdLmT6HH_7Go82q_IBGI3jm6UL4w4Q0',

        // The Client ID obtained from the Google API Console. Replace with your own Client ID.
        clientId : "158823134681-98bgkangoltk636ukf8pofeis7pa7jbk.apps.googleusercontent.com",

        // Replace with your own project number from console.developers.google.com.
        appId : "158823134681",

        // Array of API discovery doc URLs for APIs used by the quickstart
        discoveryDocs : ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],

        // Scope to use to access user's Drive items.
        scope: "https://www.googleapis.com/auth/drive.file"
    },
    server : {
        // The directories to server files out of
        PUBLIC_STATIC : "public",
        PUBLIC_GENERATED : "../client/output",

        // .ejs public sub-directory for .ejs root pages (pages users will browse to).
        EJS_ROOT_DIR : "./src/views/pages/",

        db : {
            dir : "./db",
            name : "trivia.db",
            empty : "empty.db",
            script_full_path : "./accessory/create_tables.sql"
        },
    },
    sessions : {
        SESSION_EXPIRE_HOURS: 24,
        SESSION_COOKIE_NAME: "trivia-session",
        SESSION_CLEAR_DELAY_MIN: 30
    },
    nidgets : {
        SCRIPT_PATH: "./src/client/nidgets"
    },
    locations : {
        HOST : "host.ejs"
    },
    names: {
        HOST : "@HOST"
    },
    clean_dir : [
        ".nyc_output",
        ".c8_output",
        "coverage",
        "./public/html/jit/",
        "./public/scripts/jit/",
        "./public/styles/generated"
    ],
    TIMES : {
        BUZZ : 10,
        ANSWER : 10
    }
};
export default config;