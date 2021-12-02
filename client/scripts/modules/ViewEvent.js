class ViewEvent extends CustomEvent{
    constructor(action, data = null) {
        super('click',
            {detail : {action : action, data : data}}
        );
    }
}

export default ViewEvent;