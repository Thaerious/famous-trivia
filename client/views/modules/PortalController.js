import constants from "./constants.js";

class PortalController {
    constructor(ws, view) {
        this.ws = ws;
        this.view = view;
        this.name = "";

        this.ws.addEventListener('message', (event) => this.process(JSON.parse(event.data)));
        this.ws.addEventListener('close', (event) => this.onClose(event));

        this.view.addEventListener('click', (event)=>this.send(event.detail));
        this.view.addEventListener('cell-select', (event)=>this.send(event.detail));

        this.last_model_update = null;
    }

    /**
     * Incoming messages get processed here.
     * @param message
     */
    process(message){
        if (message.action !== "ping" && message.action !== "update_timer"){
            console.log(message);
            window.lastMessage = message;
        }

        switch (message.action) {
            case "connection_established":
                this.name = message.data.name;
                if (this.view.setName) this.view.setName(message.data.name);
                break;
            case "provide_answer":
                this.view.updateAnswer(message.data.answer);
                break;
            case "update_model":
                this.view.updateModel(message.data);
                break;
            case "start_timer":
                this.view.startTimer(message.data);
                break;
            case "update_timer":
                this.view.updateTimer(message.data);
                break;
            case "stop_timer":
                break;
        }
    }

    onClose(event){
        if (this.name === constants.names.HOST){
            // window.location = "host.ejs";
        } else {
            // window.location = "contestant_join.ejs";
        }
    }

    send(msg){
        console.log(`send: ${JSON.stringify(msg)}`);
        this.ws.send(JSON.stringify(msg));
    }
}

export default PortalController;