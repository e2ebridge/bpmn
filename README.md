bpmn.js
================


Installation
------------
The easiest way to install it is via NPM:

    npm install bpmn.js


Basic Samples
-------------
These following samples assume that you installed bpmn.js via NPM.

## Usage
	
    var bpmnProcessModule = require("bpmn.js");
	var bpmnFileName = "path/to/my/bpmnFile.bpmn"; 
	// we assume there is a bpmnFile.js besides bpmnFile.bpmn that contains the handlers
	var bpmnProcess = bpmnProcessModule.createBPMNProcess("myid", fileName);

    // we start the process
    bpmnProcess.sendStartEvent("MyStart");

Storage
-------



Limitations 
-------------------


Future enhancements
-------------------


Licensing
---------

http://creativecommons.org/licenses/by-nc-sa/3.0/


Questions, comments, thoughts?
------------------------------
This is a very rough work in progress. 

Feel free to contact me at mrassinger@e2e.ch with questions or comments about this project.



