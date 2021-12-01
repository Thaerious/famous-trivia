======
Server
======

layout
======

The server serves files from the ```public/``` directory.

build
=====

stylesheets (sass to css)
-------------------------

All SASS stylesheets are located in ```src/styles```.
Build or watch stylesheets from SASS source; run one of the following::

    npm run build-css
    npm run watch-css
    npx sass src/styles:public/styles/generated/
    npx sass --watch src/styles:public/styles/generated/

Note: Omitting 'npx' will run system level SASS which may be slightly different.

embedded javascript templates (ejs to html)
-------------------------------------------

All ejs source files are located in ```src/views```.  They get rendered to ```public/html/generated```.
While you can compile ejs files one at a time, this is painfully slow.  The server is setup perform the
redering automatically.

The server generates ejs files in two modes: just-in-time, or on-demand.

Running the server with '-j' or '--jit' will generate the files everytime a request is made.  Use this modes
developing or debugging files, as it slows down the server.

Running the server with '-r' or '--render' will render the ejs files then exit.

Typical non-debug method of rendering ejs and then running the server::

    node . --render   # generate html files from ejs source
    node . --start    # start the server

