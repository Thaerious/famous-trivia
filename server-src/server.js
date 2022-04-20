import FS from "fs";
import Express from "express";
import http from "http";
import https from "https";
import { WidgetMiddleware } from "@nidget/core";
import querystring from "querystring";

(() => {
    const wmw = new WidgetMiddleware();
    const app = Express();

    app.use(`*`, (req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });

    app.set("views", "www/linked");
    app.set("view engine", "ejs");

    app.get("/", (req, res, next) => res.redirect("/host"));

    app.use((req, res, next) => wmw.middleware(req, res, next));

    app.use(Express.static("www/compiled"));
    app.use(Express.static("www/linked"));
    app.use(Express.static("www/public"));

    app.use(`*`, (req, res) => {
        console.log(`404 ${req.originalUrl}`);
        res.statusMessage = `404 Page Not Found: ${req.originalUrl}`;
        res.status(404);
        res.send(`404: page not found`);
        res.end();
    });

    // This line is from the Node.js HTTPS documentation.
    var options = {
        key: FS.readFileSync("keys/key.pem"),
        cert: FS.readFileSync("keys/certificate.pem"),
    };

    const server = http.createServer(app);
    server.listen(8000, "0.0.0.0", () => {
        console.log(`Listening on port 8000`);
    });

    // const sslServer = https.createServer(options, app);
    // server.listen(8433, "0.0.0.0", () => {
    //     console.log(`Listening on port 8433`);
    // });

    process.on(`SIGINT`, () => stop(server));
    process.on(`SIGTERM`, () => stop(server));
})();

function stop(server) {
    console.log(`Stopping server`);
    server.close();
    process.exit();
}
