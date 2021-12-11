==================
Websocket Commands
==================

Connection.parseMessage is the first method to intercept a command.
Second is Game.onInput.
Lastly, each state in Game may handle the input object.

All commands are in JSON format, with an 'action', 'players', and 'data' field.
The player field is set by the Connection class object and will overwrite any
provided by the client.  This will have the registered player name.  In the case
of the host it will be '@HOST'.  Data sub-fields are determined by the action listed below.::

    {
        action : "string",
        player : "string",
        data   : {}
    }

Accepted actions:

* request_model
* next_round
* prev_round
* start
* continue
* back
* accept
* reject
* expire
* buzz
* update_index {index}
* update_bet {bet}
* select {col, row}
* set_score {name, score}