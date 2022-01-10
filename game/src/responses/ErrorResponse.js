
export default class ErrorResponse {
    constructor (text, err) {
        this.text = text;
        if (err) console.error(err);
        this.err = err ?? `N/A`;
    }

    get object () {
        return {
            result: `error`,
            error: this.text,
            err: this.err
        };
    }
}
