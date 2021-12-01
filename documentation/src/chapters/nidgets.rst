=================
Nidgets
=================
The term "Nidget" stands for "Not-a-Widget", which is a little tongue in cheek as it is a widget.
A Widget (and a Nidget) being a reusable GUI element.  I chose Nidget as the term Widget is used quite often
already.

A Nidget consists of 3 files:

* A template .ejs file.
* A style file (either .css or .scss).
* A .js file.

Nidgets are a solution to automatically reusing template elements.  A template element holds HTML code
without actually inserting it into the DOM.  Each nidget template lives in it's own .ejs file located in the
``/views/nidgets/`` directory.

**Template File** (/views/nidgets/check-box.ejs)::

    <template id="check-box-template">
        <link rel="stylesheet" href="styles/generated/check_box.css">
        <div id="outer">
            <div id="inner"></div>
        </div>
    </template>

The template name must match the .ejs filename with dashes between words, appended with *"-template"*.
For example the "check-box-template" above would be located in the file *"check-box.ejs"*.
The root element of a Nidget template must be the html *<template>* element.
It's good practice to separate the template styling into it's own file with a stylesheet *<link>* element.

**Style File** (/src/styles/check-box.scss)::

    :host(check-box.hidden){
        display: none;
    }

    :host([nidget-disabled='true']){
        #outer{
            background-color: var(--ui-background-disabled);
        }
    }

    #outer{
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;

        #inner{
            position: absolute;
        }
    }

You can access host CSS selectors with the *:host* pseudo-class function.  It is generally good practice
to have the outermost element (besides <template>) contain the entirety of the encapsulating element.
Then you can position all child elements according to this *#outer* element.  The file name of the
style sheet is specified by the link (style) element in the template file.

**JavaScript File** (/src/client/nidgets/check-box.js)::

    import NidgetElement from "./NidgetElement.js";

    class CheckBox extends NidgetElement {
        constructor() {
            super("check-box-template");
        }
    }

    window.customElements.define('check-box', CheckBox);
    export default CheckBox;

The .js file must have the same name as the template (.ejs) file.  The name
can be either camelCase for hyphen-delimited.  The constructor needs to invoke
the super constructor, passing in the template id that was set in the template file.
The custom element gets added to the window with the hyphenated version of the name.

Processing Nidgets
------------------
While you could add Nidget imports manually, to prevent repetition a built
`browserify <https://browserify.org/>`_ function
is provided.  This will not only browserify (and babelify) the .ejs source file,
it will also automatically inject Nidget template (.ejs) and script (.js) files.
Perform the following steps.

**Insert templates into the .ejs files (add to all root .ejs files)**::

    <%- include('../partials/nidget-templates'); %>

**Add the following to the Express index.**

Generate the html and js pages.::

    const nidgetPreprocessor = new NidgetPreprocessor(config.index.ejs_nidgets, config.index.nidget_scripts).setup();
    await EJSRender.render(nidgetPreprocessor);

Setup the middleware to index Browserified .js files.::

    app.get(config.index.JIT_URL, Express.static(config.index.public_scripts));

Setup the middleware to serve rendered .ejs files.::

    app.get("*.ejs", Express.static(config.index.GENERATED_EJS_DIR,
        {
            setHeaders : (res, path, stat) => res.setHeader('Content-Type', 'text/html')
        }
    ));

Information details on individual nidgets.

.. include:: nidget-list.rst