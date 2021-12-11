Pre-requisites
==============

Node & NPM
-----------------
The app is written in ES6 style javascript using NodeJS.
Visit https://nodejs.org/en/ to download and install your version of NodeJS.

https://nodejs.org/en/

Express
-----------------
The app runs on Express; a NodeJS web index.  By default, it runs on
port 8000.  SSL has not been setup in the app, it is recommended that
a reverse-proxy is used to provide SSL security.

https://expressjs.com/

NGINX
-----------------
The app is intended to run behind a proxy, and has been built with NGINX in mind.
An example index file has been provided <here> and should be put in the
``/etc/nginx/sites-available`` folder.

https://www.nginx.com/

NGINX Commands
^^^^^^^^^^^^^^

.. code-block:: bash

    systemctl status nginx
    systemctl start nginx
    systemctl stop nginx
    systemctl restart nginx
    systemctl enable nginx
    systemctl disable nginx
