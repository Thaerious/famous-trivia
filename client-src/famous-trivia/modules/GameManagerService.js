class GameManagerService {

    /**
     * @param data object to send, will get stringified by this method
     */
    async send(data) {
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();

            xhttp.addEventListener("load", (event) => {
                console.log(xhttp.responseText);
                let response = JSON.parse(xhttp.responseText);
                if (response.result === "error") reject(response);
                else resolve(response);
            });

            xhttp.open("POST", GameManagerService.URL);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(data));
        });
    }

    /**
     * Retrieve the public game-hash associated with this
     * session.
     * @returns {Promise<unknown>}
     */
    async getGameHash() {
        return await this.send({
            action: "get-game-hash"
        });
    }

    /**
     * Stop a hosted game and clear players.
     * @param token Google API user token
     * @returns {Promise<unknown>}
     */
    async launch(token, model) {
        return await this.send({
            token: token,
            model: model,
            action: "launch"
        });
    }

    /**
     * Stop a hosted game and clear players.
     * @param token Google API user token
     * @returns {Promise<unknown>}
     */
    async terminate(token) {
        return await this.send({
            token: token,
            action: "terminate"
        });
    }

    /**
     * Get the game hash associated with a game host (token).
     * @param token Google API user token
     * @returns {Promise<unknown>}
     */
    async getHostedHash(token) {
        return await this.send({
            token: token,
            action: "get-hosted-game-hash"
        });
    }

    /**
     * Create a contestant with the given name.
     * The contestant will be associated with the current session.
     * Each session can only have one contestant.
     * The host can not also be a contestant.
     * @param token Google API user token
     * @returns {Promise<unknown>}
     */
    async joinGame(hash, name) {
        return await this.send({
            'game-hash': hash,
            name: name,
            action: "join-game"
        });
    }

    async connectHost() {
        let token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

        return await this.send({
            token: token,
            action: "connect-host"
        });
    }
}

GameManagerService.URL = "game-manager-service";
export default GameManagerService;