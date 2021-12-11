
export default class RejectedResponse{
    constructor(reason = "") {
        this.reason = reason;
    }

    get object(){
        return {
            result: 'rejected',
            reason: this.reason
        }
    }
}