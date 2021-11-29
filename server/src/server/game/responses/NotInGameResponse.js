
export default class NotInGameResponse{
    constructor(eid) {
        this.eid = eid;
    }


    get object(){
        return {
            result: 'rejected',
            reason: 'Contestant is not in a game.',
            eid : this.eid
        }
    }
}