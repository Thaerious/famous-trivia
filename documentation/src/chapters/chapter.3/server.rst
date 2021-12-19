Server
======



Startup
-------

Vanilla Startup (runs on port 8000)::

    cd famous-trivia/server
    node .

Specify Port::

    node . -p 8080
    node . --port 8080

Verbose (debug) mode::

    node . -v
    node . --verbose

.. note::

    The server needs to be run in the same environment that npm i was run.
    It references famous-trivia/game as a symbolic link.  Since windows and 
    linux have different link structures.  To work around, pack famous-trivia/game 
    as a tarball and npm i <tarball>.

Implementation
--------------

The server serves pages from the both the ``client/output``, and ``server/public`` directory.
The former is the generated client files, and the latter is for any static files.

All HTML and 'game manager service' calls have session information attached to them.  See below for more
details.

The ``game-manager-service`` is the API endpoint for launching and joining games.  It accepts and responds with
JSON objects in the requst body.  Only GET requests are suppported.

All requests from the server have custom CORS settings to allow them to work with the Google apis.

Active games communicate over a web socket on the ``/game-service.ws`` endpoint.