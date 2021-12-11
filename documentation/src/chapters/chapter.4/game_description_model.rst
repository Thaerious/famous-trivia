======================
Game Description Model
======================
The game description model (src/client/GameDescriptionModel.js) stores the questions for
a trivia game.  GameDescriptionModel#get() returns the json version of the model.  The
GameDescriptionModel class is just a helper class to manipulate the json.  The root object
(shown below) contains the game name and an array of rounds.  There are currently two flavours
of rounds, with the option to easily add more.

json root::

    {
        name : string,
        rounds : [{}, ..., {}]
    }

Jeopardy style round::

    {
        type : "categorical",
        column : [
            {
                category : string,
                font-size : string,
                cell : [
                    {
                        value : number,
                        type : "text",
                        q : string,
                        a : string
                    }
                ] x 5
            },
        ] x 6
    }

Multiple choice round::

    {
        type : "multiple_choice",
        bonus : number,
        question : string,
        answers : [
            string_1, ..., string_6
        ],
        values : [
            boolean_1, ..., boolean_6
        ]
    }