import RejectedResponse from "./RejectedResponse.js";

export default class InvalidNameResponse extends RejectedResponse{
    constructor(name) {
        super('invalid name');
        this.name = name;
    }

    get object(){
        return {
            ...super.object,
            ...{name: this.name}
        }
    }
}