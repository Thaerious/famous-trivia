function connectWebsocket(){
    let prefix = "wss://";

    if (location.protocol === "http:"){
        prefix = "ws://";
    }

    const len = location.pathname.lastIndexOf("/") + 1;
    const path = location.pathname.substr(0, len);
    const port = location.port;
    const url = `${prefix}${location.hostname}:${port}${path}game-service.ws?name=host`

    return new Promise((resolve, reject)=>{
        let socket = new WebSocket(url);
        socket.addEventListener('error', (event) => reject(event));
        socket.addEventListener('open', (event) => resolve(socket));
    });
}

export default connectWebsocket;