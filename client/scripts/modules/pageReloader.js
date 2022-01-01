function pageReloader(){
    let prefix = "wss://";

    if (location.protocol === "http:"){
        prefix = "ws://";
    }

    const len = location.pathname.lastIndexOf("/") + 1;
    const path = location.pathname.substring(0, len);
    const port = 41141;
    const url = `${prefix}${location.hostname}:${port}${path}reload_url.ws`

    return new Promise((resolve, reject)=>{
        let socket = new WebSocket(url);
        socket.addEventListener('message', (event) => onMessage(event.data));
        socket.addEventListener('error', (event) => reject(event));
        socket.addEventListener('open', (event) => resolve(socket));
    });
}

function onMessage(_data){
    console.log(_data);
    const data = JSON.parse(_data);
    const url = "/" + data.url;
    if (location.pathname.indexOf(url) === 0){
        location.reload();
    }
}

export default pageReloader;