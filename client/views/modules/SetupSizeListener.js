function setupSizeListener(){
    function reportWindowSize() {
        const pageContainer = document.querySelector("#page-container");
        const ratio = window.innerWidth / window.innerHeight;

        if (ratio >= 16/9){
            pageContainer.classList.add("aspect-fit");
            pageContainer.classList.remove("shrink-horz");
        } else {
            pageContainer.classList.remove("aspect-fit");
            pageContainer.classList.add("shrink-horz");
        }
    }

    window.addEventListener("resize", e=>reportWindowSize());
    reportWindowSize();
}

export default setupSizeListener;