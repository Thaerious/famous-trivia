=====================
Game Manager Endpoint
=====================
The GameManagerEndpoint is the main api starting point for any client interacting with the index.
The endpoint url is "HOSTNAME/game-manager-service".  The format, exampled below, consists of
a required 'action' field.  Other required fields depend on the contents of the action field.  The
client has a corresponding  GameManagerService class which calls the endpoint actions.

All actions return a json object with the result field set to 'success', 'rejected', or 'error'.
If the result if 'error' or 'rejected' there will also be a 'reason' field.
The following actions are supported:

launch
------
Launch a new game with the user as host.
The model is result from GameDescriptionModel#get().
This method will verify the user's google credentials.
The 'game-hash' returned is used to connect to the game with
future API calls.
A user can only host one game at a time.::

  {
    'action' : 'launch',
    'model'  : game-description-model,
    'token'  : google-auth-token
  }

returns::

    res.json({
        result : "success",
        hash   : game-hash
    }

terminate
---------
Stop a currently running game.
This method will verify the user's google credentials.::

    {
        action : "terminate",
        token  : google-auth-token
    }

returns::

    res.json({
        result : "success"
    }

join-game
---------
Create a contestant with the given name.
The contestant will be associated with the current session.
Each session can only have one contestant.
The host can not also be a contestant.::

    {
        'action'    : "join-game",
        'game-hash' : game-hash,
        'name'      : string
    }

returns::

    {
        result : 'success'
    }

has-game
--------
Determine if a user is currently hosting a game.::

  {
    'action' : 'has-game',
    'token'  : google-auth-token
  }

returns::

    {
        result : 'success',
        hash   : game-hash,
    }

get-game-hash
-------------
Determine if the current session has been associated with a game (see join-game).::

    {
        'action'    : "get-game-hash"
        'game-hash' : game-hash
    }

returns::

    {
        result : 'success',
        hash   : game-hash,
    }