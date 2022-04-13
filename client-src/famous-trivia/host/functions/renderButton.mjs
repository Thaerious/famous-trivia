function onSuccess(googleUser) {
    console.log("Logged in as: " + googleUser.getBasicProfile().getName());

    let user = gapi.auth2.getAuthInstance().currentUser.get();
    let hasScopes = user.hasGrantedScopes("https://www.googleapis.com/auth/drive.appdata");

    if (!hasScopes) {
        const options = new gapi.auth2.SigninOptionsBuilder();
        options.setScope("https://www.googleapis.com/auth/drive.appdata");

        googleUser = gapi.auth2.getAuthInstance().currentUser.get();

        googleUser.grant(options).then(
            function (success) {},
            function (fail) {
                alert(JSON.stringify({ message: "fail", value: fail }));
            }
        );
    }

    const event = new CustomEvent("google-login", { detail: googleUser.getBasicProfile() });
    window.dispatchEvent(event);
}

function onFailure(error) {
    console.log("render button failed");
    console.log(error);
}

function renderButton() {
    gapi.signin2.render("sign-in", {
        scope: "profile email",
        width: 320,
        height: 50,
        longtitle: true,
        theme: "dark",
        onsuccess: onSuccess,
        onfailure: onFailure,
    });
}

window.renderButton = renderButton;

export default renderButton;
