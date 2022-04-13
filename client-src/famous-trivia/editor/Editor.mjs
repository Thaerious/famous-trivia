import FileOps from "../modules/FileOps.js";
import Authenticate from "../modules/Authenticate.js";
import MenuContainer from "../menu/menu-container/MenuContainer.mjs";
import EditorPane from "./EditorPane.js";
import GameDescriptionHelper from "../modules/GameDescriptionHelper.js";
import setupSizeListener from "./SetupSizeListener.js";
import emptyCategory from "../json_schema/empty_categorical.js";
import emptyRoot from "../json_schema/empty_root.js";

let fileOps = new FileOps();
let editorPane = null;

window.onload = async () => {
    await setup();
    setupSizeListener();
    clearBusy();
}

window.addEventListener("beforeunload", ()=>{
    editorPane.onSave();
});

function clearBusy(){
    document.querySelector(".bg").classList.remove("busy");
    document.querySelector(".busy-box").classList.add("hidden");
}

async function setup(){
    let start = new Date();

    parseURLParameters();
    new MenuContainer().init("#menu");

    try {
        await new Authenticate().loadClient();
        await fileOps.loadClient();
    } catch (err) {
        console.log(err);
    }

    let gameDescriptionHelper = new GameDescriptionHelper();

    if (window.parameters.fileId) {
        let file = await fileOps.get(window.parameters.fileId);
        gameDescriptionHelper.set(JSON.parse(file.body))
        window.gameDescriptionHelper = gameDescriptionHelper;
    } else {
        gameDescriptionHelper.set(emptyRoot);
        gameDescriptionHelper.addRound(emptyCategory);
    }

    document.querySelector("#game-name").textContent = gameDescriptionHelper.name;
    editorPane = new EditorPane(gameDescriptionHelper, fileOps, window.parameters.fileId);
    window.editorPane = editorPane;

    let end = new Date();
    let time = end - start;
    console.log("Load Time " + time + " ms");
}

/**
 * Change the name of the file in google's app data folder.
 */
function renameModel() {
    let name = document.querySelector("#game-name").textContent;
    fileOps.rename(window.parameters.fileId, name + ".json");
    window.model.name = name;
    saveModel();
}

/**
 * Extract value from the URL string, store in 'window.parameters'.
 */
function parseURLParameters() {
    window.parameters = {};
    const parameters = window.location.search.substr(1).split("&");
    for (const parameter of parameters) {
        const split = parameter.split(/=/);
        window.parameters[split[0]] = split[1] ?? "";
    }
}

function pushParameters(){
    let url = window.location.origin + window.location.pathname;
    let delim = "?";
    for (let p in window.parameters){
        url = url + delim + p + "=" + window.parameters[p];
        delim = "&";
    }
    window.history.pushState("", "", url);
}

window.pushParameters = pushParameters;