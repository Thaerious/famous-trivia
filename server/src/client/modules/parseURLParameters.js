/**
 * Extract value from the URL string, store in 'window.parameters'.
 */
function parseURLParameters() {
    window.parameters = {};
    const parameters = window.location.search.substr(1).split("&");
    for (const parameter of parameters) {
        const split = parameter.split(/=/);
        window.parameters[split[0]] = split[1] ?? "";
    }
    return window.parameters;
}

export default parseURLParameters();