import Logger from "@thaerious/logger";
const logger = Logger.getLogger();

/**
 * Update Content Security Policy headers.
 * Will add google to the security headers.
 * @param req
 * @param res
 * @param next
 */
function cors(req, res, next) {
    logger.channel("verbose").log(`cors: ${req.originalUrl}`);
    let csp = extractCSP(res);
    csp["default-src"] = "ws://localhost:41141 'self' *.google.com *.googleapis.com 'unsafe-inline' 'unsafe-eval'";
    csp["style-src"] = "'self' *.google.com 'unsafe-inline'";
    delete csp["script-src"];
    delete csp["script-src-attr"];
    res.set("Content-Security-Policy", concatCSP(res, csp));
    next();
}

/**
 * Extract Content Security Policy from header
 * Returns a JS object with each policy as a field-name, and the
 * contents of that policy as the field-value.
 * @param res
 * @returns {JS-Object}
 */
function extractCSP(res){
    let csp = res.get("Content-Security-Policy").split(";");
    let dict = {};

    for (let policy of  csp) {
        let kv = policy.split(/ /);
        dict[kv[0]] = kv[1] ?? "";
    }

    return dict;
}

/**
 * Prepare Content Security Policy for header.
 * Concatenates the JS-Object returned from #extractCSP into a string.
 * This string can be sent in a response header under "Content-Security-Policy".
 * @param res
 * @param csp
 * @returns {string}
 */
function concatCSP(res, csp){
    let policyString = "";
    for (let key in csp){
        policyString = policyString + key + " " + csp[key] + ";"
    }
    return policyString;
}

export default cors;