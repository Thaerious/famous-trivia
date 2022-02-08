The documentation is made with SPHINX.
To build, execute the following:

```
> sudo apt-get install python3-sphinx
> sphinx-build -b html src build
```

Browse to <INSTALL_PATH>/famous-trivia-documenation/build/index.html

Or, upload <INSTALL_PATH>/famous-trivia-documenation/build to the web server

If Sphinx is already setup, in Linux (WSL) execute doc.sh to view docs.

Start Up
========

cd game
npm i
cd ..

cd renderer
npm i
cd ..

cd client
npm i
node ../renderer/ -v
cd ..

cd server
npm i
node .

browse to "http://localhost:8000/host.html"