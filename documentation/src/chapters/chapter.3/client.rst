Client
======

Builds the remote client for both players and the host.  The HTML is generated from Extended JavaScript (EJS) files, while
the CSS is generated from SASS files.  Lastly, the JS is packaged using Browserify.  All servable
files are located in ``client/output``.

* The ``client/src`` directory contains a custom EJS and Browserfify scripts.
* The ``client/scripts``, ``client/styles``, and ``client/views`` contain the JS, EJS, and SASS source files respectively.
* The ``client/nidgets`` directory contains the reusable JS, EJS, and SASS components.  These are injected into the final documents during the build process.

Build Instructions
------------------

::

    cd client
    npm run build-css
    node . -v # the -v flag provides details

.. note::

    The node rendering program runs faster in Windows as opposed to WSL.