const constants = {
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
    locations : {
        HOST : "host.html",
        EDITOR : "editor.html",
        LAUNCH_CONSOLE : "launch_console.html",
        HOST_PORTAL : "host_portal.html",
        CONTESTANT_JOIN : "contestant_join.html",
        CONTESTANT_PORTAL : "contestant_portal.html"
    },
    names: {
        HOST : "@HOST"
    }
};
export default constants;