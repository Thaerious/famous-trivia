import GameDescriptionHelper from "../modules/GameDescriptionHelper.js";
import FileOps from "../modules/FileOps.js";
import GameManagerService from "../modules/GameManagerService.js";
import emptyRoot from "../json_schema/empty_root.js";
import emptyCategory from "../json_schema/empty_categorical.js";
import constants from "../modules/constants.js";

let fileOps;
const gameManagerService = new GameManagerService();

window.addEventListener("google-login", async (event)=>{
    await fileOps.load();    
    document.querySelectorAll("nidget-button").forEach(e => e.disabled = false);
    document.querySelector("#sign-out").classList.remove("hidden");
});

window.addEventListener("load", async ()=>{
    fileOps = new FileOps();
    // await getHostedHash();
    addMenuListeners();
});

function onLoad(event) {
    let id = event.detail.id;
    window.location = `${constants.locations.EDITOR}?action=load&fileId=${id}`;
}

async function getHostedHash() {
    let token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    let response = await gameManagerService.getHostedHash(token);
    console.log(response);
    if (response.result === "success") {
        window.location = constants.locations.LAUNCH_CONSOLE;
    }
}

async function onLaunch(event) {
    let id = event.detail.id; // google file identifier

    let file = await fileOps.get(id);
    let model = JSON.parse(file.body);
    let token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

    let response = await gameManagerService.launch(token, model);
    if (response.result === "success") {
        window.location = constants.locations.LAUNCH_CONSOLE;
    } else {
        window.alert("Error launching game");
        console.log(response);
    }
}

async function deleteFile(event) {
    let fileList = document.querySelector("file-list");

    fileList.busy = true;
    try {
        await fileOps.delete(event.detail.id);
    } catch (err) {
        console.log(err);
    }
    await populateFileList();
    fileList.busy = false;
}

function addMenuListeners() {
    document.querySelector("#b-create").addEventListener("click", async e => {
        let gameDescriptionHelper = new GameDescriptionHelper();
        gameDescriptionHelper.set(emptyRoot);
        gameDescriptionHelper.addRound(emptyCategory);
        gameDescriptionHelper.name = "New Game";
        try{
            let fp = await fileOps.create();
            await fileOps.setBody(fp, JSON.stringify(gameDescriptionHelper.get(), null, 2));
            window.location = `${constants.locations.EDITOR}?action=load&fileId=${fp}`;
        } catch (error){
            console.log(error);
        }
    });

    document.querySelector("#b-upload").addEventListener("click", async e => {
        let anchor = document.querySelector("#upload-anchor");
        anchor.click();

        anchor.addEventListener(
            "change",
            event => {
                const data = anchor.files[0];
                const reader = new FileReader();

                reader.onload = async e => {
                    let name = JSON.parse(e.target.result).name;
                    let fp = await fileOps.create(name + ".json");
                    await fileOps.setBody(fp, e.target.result);
                    window.location = `${constants.locations.EDITOR}?action=load&fileId=` + fp;
                };
                reader.readAsText(data);
            },
            { once: true }
        );
    });

    document.querySelector("#b-edit").addEventListener("click", async e => {
        await populateFileList();
        let fileList = document.querySelector("file-list");
        fileList.addEventListener("select-file", onLoad, { once: true });
        fileList.addEventListener("close-dialog", ()=>fileList.removeEventListener("select-file", onLoad));
    });

    document.querySelector("#b-launch").addEventListener("click", async e => {
        await populateFileList();
        let fileList = document.querySelector("file-list");
        fileList.addEventListener("select-file", onLaunch, { once: true });
        fileList.addEventListener("close-dialog", ()=>fileList.removeEventListener("select-file", onLaunch));
    });

    document.querySelector("#b-delete").addEventListener("click", async e => {
        await populateFileList();
        let fileList = document.querySelector("file-list");
        fileList.addEventListener("select-file", deleteFile);
        fileList.addEventListener("close-dialog", ()=>fileList.removeEventListener("select-file", deleteFile));
    });

    document.querySelector("#sign-out").addEventListener("click", async e => {
        document.querySelectorAll("nidget-button").forEach(e=>e.disabled = true);
        document.querySelector("#sign-out").classList.add("hidden");
        gapi.auth2.getAuthInstance().signOut();
    });
}

async function populateFileList() {
    let fileList = document.querySelector("file-list");

    fileList.show();
    fileList.busy = true;
    fileList.clear();

    let list = await fileOps.list();

    for (let item of list) {
        let i = item.name.indexOf(".");
        fileList.addItem(item.name.substr(0, i), item.id);
    }

    fileList.busy = false;
}
