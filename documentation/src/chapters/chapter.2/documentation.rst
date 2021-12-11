Documentation
=============

building the documentation
--------------------------

The documentation made with SPHINX.
The following commands are used to build the documentation.

Install SPHINX with ``sudo apt-get install python3-sphinx``.

``pip install git+https://github.com/sphinx-doc/sphinx``.

Install the Read-The-Docs theme with ``sudo apt-get install python3-sphinx``.

Build the documentation with ``sphinx-build -b html src build``.

uploading to github
-------------------

::

    cd ..
    git clone git@github.com:Thaerious/thaerious.github.io
    cp -r ../famous-trivia-documenation/build/* ./famous-trivia/ 
    git add famous-trivia/
    git commit -m"..."
    git push

Github hosted documentation at ``https://thaerious.github.io/famous-trivia/``.
