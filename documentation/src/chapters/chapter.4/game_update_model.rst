=================
Game Update Model
=================

Game-GameModel-RoundModel interaction
-------------------------------------

Triggered by a change in game state, or an event from the server, the Game calls methods on the GameModel.
Methods in GameModel will call the same method in the RoundModel if it exists.
This may result in a change in the GameModel's state, or the RoundModel's state.  
Calling GameModel.getUpdate() will take a snapshot of the current GameModel's state.
This will contain a snapshot of the RoundModel's state (under the round field).
The Game.getUpdate() method calls GameModel.getUpdate and places the result in the 'data.model' field.
This along with other information added by Game is sent to the client.

Every time the game updates the model all connected clients (players and host) receive
and update object.
The 'data' field contains the update information.  
The other fields are to indentify the update packet.
The 'round' field is specific to the current round.::
    
    action: "update_model",
    id-hash: randomized-hash,
    time-stamp: date,
    data: {
        state: integer (fsm state),
        model: {
            round : {...}
            players : [{
                name : string,
                score : number,
                active : boolean,
                light_state : constants.LIGHT_STATE
            }]
        }
    }

[1] Jeopardy Style Round, waiting to pick a question ::

    {
        current_player: string,
        spent_players: [string...]
        style: "j",
        state: "board",
        spent: [[bool, bool, bool, bool, bool] x6],
        values: [[100, 200, 300, 400, 500] x6],
        categories: [{
            text: string,
            font-size: string ("16px")
        } x6]  
    }

[2] After question picked.  Includes all fields from [1] ::

    {
        state: "question",    
        col: number,
        row: number,
        type: "text",
        question: string,
        answer: string (host only),
    }

[3] After answer rejected/accepted. Includes all fields from [1] and [2] ::

    {
        "state": "reveal",        
        "answer": string (host & players)
    }