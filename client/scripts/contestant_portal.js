import ContestantPortalView from "./modules/ContestantPortalView.js";
import PortalController from "./modules/PortalController";
import connectWebsocket from "./modules/connectWebsocket.js";
import setupSizeListener from "./modules/SetupSizeListener";

window.onload = async () => {
    let start = new Date();

    setupSizeListener();
    window.view = new ContestantPortalView();
    let ws = await connectWebsocket();
    new PortalController(ws, window.view);
    let end = new Date();
    let time = end - start;
    console.log("Load Time " + time + " ms");
}

