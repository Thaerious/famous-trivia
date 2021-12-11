
class NameValidator{

    /**
     * Return true if the name is valid,
     * otherwise return false.
     * At least 2 characters, not more than 15
     * Starts with a letter, followed by letters, numbers, dash, or underscore
     * Can have a single dash or underscore.
     * @param source
     * @returns {boolean}
     */
    validate(source) {
        const pre = this.preProcess(source);
        if (pre.length < 2) return false;
        if (pre.length > 15) return false;
        if (pre.match(/^[a-zA-Z_-][-_]?[0-9a-zA-Z]*$/)) return true;
        return false;
    }

    /**
     * Transform the name into a standard form.
     * - trim leading/trailing spaces
     * - convert to upper case
     * null/undefined names get converted to zero-length strings
     * @param source
     */
    preProcess(source){
        if (!source) return "";
        if (typeof source !== "string") return "";
        return source.trim().toUpperCase();
    }
}

export default NameValidator;