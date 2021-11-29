let hash = Math.trunc(Math.random() * 100000)

function report(){
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "report-coverage");
    xhttp.setRequestHeader("Content-type", "application/json");

    const date = new Date().toLocaleDateString("en-GB", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
    }).replaceAll("/","");

    const time = new Date().toLocaleTimeString().replaceAll(":", "").substr(0, 6).trim()

    xhttp.send(JSON.stringify({
        file : window.location.pathname.substr(1),
        date : date,
        hash : hash,
        coverage : window.__coverage__
    }));
};

window.report = report;

window.addEventListener("load", ()=>{
    hash = Math.trunc(Math.random() * 100000)
});

window.addEventListener("beforeunload", ()=>{
    console.log("unload " + window.location.pathname.substr(1));
    report();
});

setInterval(()=>report(), 5000);