import RejectedResponse from "./RejectedResponse.js";

// noinspection JSValidateTypes
export default class NameInUseResponse extends RejectedResponse {
    constructor (name) {
        super(`name is already in use`);
        this.name = name;
    }

    get object () {
        return {
            ...super.object,
            ...{ name: this.name }
        };
    }
}
