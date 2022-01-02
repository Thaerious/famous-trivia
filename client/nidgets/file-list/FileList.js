import NidgetElement from "../script/NidgetElement.js";

class SelectFileEvent extends  CustomEvent{
    constructor(id) {
        super('select-file', {detail : {id : id}});
    }
}

class CloseDialogEvent extends  CustomEvent{
    constructor(id) {
        super('close-dialog');
    }
}

class FileList extends NidgetElement{
    constructor() {
        super("file-list");        
    }

    // override from NidgetElement
    ready(){
        this.querySelector(".close").addEventListener("click", ()=>{
            this.hide();
        });
    }

    clear(){
        for (let ele of this.querySelectorAll(".file-item")){
            this.querySelector("#inner-list").removeChild(ele);
        }
    }

    addItem(filename, id){
        let meta = document.createElement("div");
        meta.classList.add("file-item");
        meta.setAttribute("data-id", id);
        meta.setAttribute("data-name", filename); // allows for tests to find the button
        this.querySelector("#inner-list").appendChild(meta);
 
        let ele = document.createElement("span");
        ele.classList.add("file-name");
        ele.innerText = filename;
        meta.appendChild(ele);

        ele.addEventListener("click", ()=>this.dispatchEvent(new SelectFileEvent(id)));
    }

    show(){
        this.classList.remove("hidden");
    }

    hide(){
        this.classList.add("hidden");
        this.dispatchEvent(new CloseDialogEvent());
    }

    set busy(value){
        if (value) this.querySelector("#file-list-busy").classList.remove("hidden");
        else this.querySelector("#file-list-busy").classList.add("hidden");
    }    
}

window.customElements.define('file-list', FileList);
export default FileList;