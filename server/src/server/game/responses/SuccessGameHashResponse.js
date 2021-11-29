import SuccessResponse from "./SuccessResponse.js";

export default class SuccessGameHashResponse extends SuccessResponse{
    constructor(gameHash) {
        super();
        this.gameHash = gameHash;
    }

    get object(){
        return {
            ...super.object,
            ...{'game-hash': this.gameHash}
        }
    }
}