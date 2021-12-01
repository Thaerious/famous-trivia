import NidgetElement from "./NidgetElement.js";

class TriviaTimer extends NidgetElement{

    constructor() {
        super("trivia-timer-template");
    }

    start(value){
        if (value) this.set(value);
        this.timeout = setTimeout(()=>this.step(), 500);
        this.running = true;
    }

    stop(){
        if (this.timeout){
            this.running = false;
            clearTimeout();
        }
    }

    show(value){
        this.querySelector(".outer").classList.remove("cycle");
        if (value) {
            this.querySelector("#current-tick .text").innerHTML = value;
        }
        super.show();
    }

    spin(){
        this.querySelector(".outer").classList.remove("cycle");
        setTimeout(
            ()=>this.querySelector(".outer").classList.add("cycle"),
            10
        );

        setTimeout(
            ()=>this.querySelector("#current-tick .text").innerHTML = this.querySelector("#prev-tick").innerHTML,
            500
        );
    }

    step(){
        if (this.value > 0 && this.running) {
            this.tick();
            this.timeout = setTimeout(()=>this.step(), 1000);
        }
    }

    set(value){
        this.querySelector("#prev-tick .text").innerHTML = value;
        this.spin();
    }

    tick(nextValue){
        nextValue = nextValue ?? --this.value;
        this.querySelector("#prev-tick").innerHTML = nextValue;
        this.querySelector(".outer").classList.remove("cycle");

        setTimeout(
            ()=>this.querySelector(".outer").classList.add("cycle"),
            500
        );

        setTimeout(
            ()=>this.querySelector("#current-tick .text").innerHTML = nextValue,
            900
        );
    }
}

window.customElements.define('trivia-timer', TriviaTimer);
export default TriviaTimer;