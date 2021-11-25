
Deployment
============

Quick Start
-----------

Clone the repository::

    git clone git@github.com:Thaerious/famous-trivia-server.git
    cd famous-trivia-server
    npm i
    npm run build-css
    node . -r # render .ejs files
    node . # start the server

Details
-------

Clone the repository onto your index::

    git clone git@github.com:Thaerious/trivia-index.git
    cd trivia-index

Setup the reverse proxy for NGINX.
Add the following to the appropriate sites-available file (in the index block).

.. code-block::

    location /trivia/ {
        proxy_pass http://127.0.0.1:8000/;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Read-IP $remote_addr;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

Google
------

Visit https://console.cloud.google.com/apis/dashboard and create an API key for the following api.
Then copy browser key, client id, and app id to /src/config.js file.

* Google Drive API
* Google Picker API
* People API

**Run the index manually.**

Build the style sheets with ``npm run build-css``.  Install the node packages with ``npm i``.

When running the index the first time include the -r flag (``node . -r``) to render html & js files.
Then run the index (``node .``):

.. code-block::

    $ node . -r
    contestant_join
    contestant_portal
    editor
    host
    host_portal
    launch_console

    $ node .
    HTTP listener started on port 8000

Browse to ``https://frar.ca/trivia/host.ejs`` replace *frar.ca* with your index name.

Screen
------

.. code-block::

    screen --version
    Ctrl+a ?
    screen -S session_name
    screen -r

* Ctrl+a d Detach session
* Ctrl+a c Create a new window (with shell).
* Ctrl+a " List all windows.
* Ctrl+a 0 Switch to window 0 (by number).
* Ctrl+a A Rename the current window.
* Ctrl+a S Split current region horizontally into two regions.
* Ctrl+a | Split current region vertically into two regions.
* Ctrl+a tab Switch the input focus to the next region.
* Ctrl+a Ctrl+a Toggle between the current and previous windows
* Ctrl+a Q Close all regions but the current one.
* Ctrl+a X Close the current region.

System Daemon
-------------

    sudo bash install.bat USERNAME

For permanent installation add the systemd settings file.  A script has been provided to
setup the systemd file.  It needs to be run as sudo because it updates the /etc/systemd/system directory.
Pass in the username that you want to run the index as.  It will use the current working directory
so make sure you are in the project's root directory.  The following assumes the -b flag was used at least once.

.. code-block::

    sudo bash install.bat USERNAME # setup systemd config file
    sudo systemctl daemon-reload # to restart systemd
    sudo systemctl start trivia # to start trivia index
    sudo journalctl -u trivia # to view results