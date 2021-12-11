Introduction
------------

The Famous-Trivia app is a platform for playing trivia in concert with a video call.
It runs on an express webserver and performs dynamic updates the contestants pages.
The host can customize the questions which are stored in a Google account.

To create and host a game visit https://frar.ca/trivia/host.ejs

Quick Links
-----------
The following is a list of links for pages involved in the project and/or documentation.

* Sphinx Documentation |sphinx_documentation|.
* Trivia Project Github Repository |trivia-github|.

.. |sphinx_documentation| raw:: html

   <a href="https://www.sphinx-doc.org/en/master/contents.html" target="_blank">[GO]</a>

.. |trivia-github| raw:: html

   <a href="https://github.com/Thaerious/trivia-index" target="_blank">[GO]</a>

Project Layout
--------------
* documention : sphinx documentation files
* game : game backend, no communication
* server : express server
* client : source client pages and custom .ejs/browserify builder