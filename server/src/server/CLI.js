import readline from 'readline';

class CLI {
    constructor(gameManager, sessionManager) {
        this.gameManager = gameManager;
        this.sessionManager = sessionManager;

        let rl = readline.createInterface(process.stdin, process.stdout);
        rl.setPrompt('SERVER> ');
        rl.prompt();

        rl.on('line', function(line) {
            try {
                this.command(line);
            }catch(err){
                console.log("CLI error");
                console.log(err);
            }
            rl.prompt();
        }.bind(this));

        rl.on('close', function() {
            process.exit(0);
        });
    }

    exit(){
        console.log("Goodbye!");
        process.exit(0);
    }

    command(command) {
        let split = command.split(/[ ]+/);

        switch (split[0].toLowerCase()) {
            case "x":
            case "exit":
                this.exit();
            break;
            case "g":
            case "games":
                this.listGames();
                break;
            case "":
                break;
            case "help":
            case "?":
            default:
                console.log("exit, x : terminate server");
                break;
        }
    }

    listGames(){
        const hostedGames = this.gameManager.listHostedGames();
        for (const hostedGame of hostedGames){
            console.log(hostedGame);
        }
        console.log("count : " + hostedGames.length);
    }
}

export default CLI;