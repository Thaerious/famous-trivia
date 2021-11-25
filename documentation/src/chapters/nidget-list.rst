Nidget Components
-----------------

nidget-button
^^^^^^^^^^^^^

HTML Example::

<nidget-button class="round">CLOSE</nidget-button>

* Requires a button style class.
* * round (currently the only one available)
* The host element .css needs to specify height and width.
* The button will take it's text from the host element text.
* The element utilized the following .css variables.

**CSS Variables**

* --ui-button-color: ###, ###, ###;

nidget-radio-button
^^^^^^^^^^^^^^^^^^^

**Events**

*NidgetRadioGroup #selection-changed*

::

    detail = {
        "id": id,
        "element": element,
        "prev-id": this.selected,
        "prev-element": this.getSelectedElement()
    }

**Fields**

NidgetRadioGroup.selected : selector of button



**HTML Example**::

    <nidget-radio-group>
        <nidget-radio-button id="option1"></nidget-radio-button>
        <nidget-radio-button id="option2"></nidget-radio-button>
        <nidget-radio-button nidget-disabled="true" id="option3" selected="false"></nidget-radio-button>
        <nidget-radio-button id="option4"></nidget-radio-button>
    </nidget-radio-group>

**CSS Example**::

    nidget-radio-group {
      position: absolute;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      width: 60px;
      height: 300px;
    }

    nidget-radio-button {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 2px;
    }

**CSS Variables**

* --ui-border-color, #000000
* --ui-background, whitesmoke
* --ui-background-disabled, #888
* --ui-border-color-disabled, #444

aspect-container
^^^^^^^^^^^^^^^^

An element that dynamically resizes to match an aspect ratio (default w:h -> 16:9).
The size will attempt to fill as much of the viewport as possible while maintaining
the aspect ratio.

**HTML Example**::

<aspect-container style="--aspect-width: 2; --aspect-height: 3;"></aspect-container>
<aspect-container></aspect-container>

**CSS Variables**

* get
* * --aspect-width: 16
* * --aspect-height: 9
* set
* * --height-value: var(--aspect-ratio) * 100vw | 100vh;
* * --width-value: var(--aspect-ratio) * 100vh | 100vw;

**Sizing Components**

CSS Example.::

    #css {
      width: calc(0.08 * var(--width-value));
      height: calc(0.08 * var(--width-value));
      font-size: calc(1.2 * var(--base-font-size));
    }

text-input
^^^^^^^^^^

A single line text input component.  Only the text contents of the component will be
used, removing all html markup.

**Events**

*TextInput #text-update*::

    detail = {content : this.content}

*TextInput #text-enter*

Dispatched when the enter key is pressed.::

    detail = {content : this.content}

**HTML Example**::

    <text-input tabindex="0" hint="type name here" class="top1 imadiv"></text-input>


**HTML Attributes**

* filter:  a regex pattern that will reject input when it isn't matched.
* hint: a tool tip that will be removed when input commences.

**CSS Example**::

**CSS Variables**

* --ui-ti-hint, 128, 128, 128
* --ui-border-color-disabled, #444
* --ui-border-color, #000
* --ui-background-disabled, #888
* --ui-border-color-disabled, #444
* --ui-font-color-disabled, #444
* --ui-font-color-hint, #888