bpmn
================
This module executes BPMN 2.0 processes.

BPMN execution is deemed to be a good way to describe process oriented business logic. This is especially true if we have to describe the orchestration and collaboration of service- and UI-interactions. Many of these interactions are asynchronous and event driven making Node.js an ideal candidate for implementing a BPMN engine.

To draw the BPMN file to be executed each BPMN 2.0 compliant tool can be used.

We are working on a simple browser based BPMN 2.0 editor also utilizing Node.js as backend.
You may learn more about our efforts and other Node.js packages on [http://e2ebridge.com](http://e2ebridge.com).

The e2e-transaction-logger package can be used optionally. The generated transaction log files enable the [E2E Dashboards](http://docu.e2ebridge.com/E2E+Dashboards) to provide graphical views of your processes.

Installation
------------
The easiest way to install it is via NPM:

    npm install bpmn

If you don't have a compiler on your platform the restify dtrace dependency won't be installed. Just ignore it.

Assumptions
-----------

- This package assumes each BPMN 2.0 file is accompanied by an equal named JS file. For example, the directory containing `myprocess.bpmn` must contain also `myprocess.js` holding the BPMN event handlers.
- Each BPMN element name is unique per process. This simplifies live considerably because we can use names instead of IDs simplifying the world for users and developers alike. If this is not the case, an error is thrown while creating the process.

Remarks
-------

Process can be managed or unmanaged. Unmanaged processes are not stored in any way, the developer is responsible of storing the returned process objects to be able to use them later. Process manager allow to create multiple processes and store them during their execution. The managers have functions to retrieve existing processes by id, filter by property or state. Managers will also persist the managed processes if persistency options are set.

Basic Example
=============

These following samples assume that you installed bpmn via npm.

Assume myProcess.bpmn describes the following process

![](https://raw.githubusercontent.com/e2ebridge/bpmn/master/examples/processes/task.png)

then this process can be created by

   
	var bpmn = require("bpmn");
	// We assume there is a myProcess.js besides myProcess.bpmn that contains the handlers
	bpmn.createUnmanagedProcess("path/to/myProcess.bpmn", function(err, myProcess){

        // we start the process
        myProcess.triggerEvent("MyStart");

	});

The handler file looks like:

	exports.MyStart = function(data, done) {
    	// called after the start event arrived at MyStart
    	done(data);
	};

	exports.MyTask = function(data, done) {
    	// called at the beginning of MyTask
    	done(data);
	};

	exports.MyTaskDone = function(data, done) {
    	// Called after the process has been notified that the task has been finished
		// by invoking myProcess.taskDone("MyTask").
		// Note: <task name> + "Done" handler are only called for 
		// user tasks, manual task, and unspecified tasks
    	done(data);
	};

	exports.MyEnd = function(data, done) {
    	// Called after MyEnd has been reached
    	done(data);
	};

Processes can also be created from an xml string instead of file. In this case the handler can be an object or a javascript string that would be parsed.


	bpmn.createUnmanagedProcessFromXML("<definitions ... </definitions>", "exports.MyStart = ...", function(err, myProcess){

        // we start the process
        myProcess.triggerEvent("MyStart");

	});



If no handler is defined, the default handler is being called. This handler can also be specified in the handler file by:

	/**
 	 * @param {String} eventType Possible types are: "activityFinishedEvent", "callHandler"
 	 * @param {String?} currentFlowObjectName The current activity or event
 	 * @param {String} handlerName
 	 * @param {String} reason Possible reasons:
	 * 							- no handler given
	 *							- process is not in a state to handle the incoming event
	 *							- the event is not defined in the process
	 *							- the current state cannot be left because there are no outgoing flows
 	 */	
	exports.defaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason, done) {
		// Called, if no handler could be invoked. 
    	done(data);
	};

If the default handler is not specified the default default event handler is being called which just logs a message to stdout.

Besides the default event handler, it is also possible to specify a default error handler:
	
	exports.defaultErrorHandler = function(error, done) {
    	// Called if errors are thrown in the event handlers
    	done();
	};

Sometimes it is useful to call handlers before or after each activity, task, or catch event. To do this specify

	exports.onBeginHandler = function(currentFlowObjectName, data, done) {
        // do something
		done(data);
    };
    exports.onEndHandler = function(currentFlowObjectName, data, done) {
        // do something
		done(data);
    };


Handler Context (this)
----------------------

Each handler is called in the context of the current process. More formally: `this` is bound to `BPMNProcessClient`. This object offers the following interface to the current process instance:

- `taskDone(taskName, data)`: notify the process that a task has been done. This triggers calling the event handler: `taskName` + "Done"
- `triggerEvent(eventName, data)`: send an event to the process
- `getState()`: get the state of the current process. The state object is `BPMNProcessState`.
- `getHistory()`: get the history of the current process. Basically a list of all visited activities and events encapsulated in `BPMNProcessHistory`
- `setProperty(name, value)`: set a process property. This property is also persisted together with the process. The value is a valid JS data object. That is, we do not persist functions.
- `getProperty(name)`: get property.
- `getParentProcess()`: if this process has been called by a `callActivity` activity, this call returns a `BPMNProcessClient` instance of the calling process. Otherwise it returns `null`.
- `getParticipantByName(participantName)`: if this process collaborates with other processes (see section *Collaboration Processes*), this call returns a `BPMNProcessClient` instance of a participating process instance having the name `participantName`. This allows to send for example an event to a participating process by
	this.getParticipantName("Another process").triggerEvent("my event");

Handler Names
-------------
The handler names are derived by replacing all not allowed JS characters by '_'. For example, "My decision?" becomes `My_decision_`. The bpmn module exports `mapName2HandlerName(bpmnName)` that can be invoked to get the handler name for a given BPMN name.

Exclusive Gateways (Decisions)
==============================

If the following process has to be implemented, we have to provide three handlers for the exclusive gateway:
	
	exports.Is_it_ok_ = function(data, done) {
    	// called after arriving at "Is it ok?"
    	done(data);
	};

	exports.Is_it_ok_$ok = function(data) {
    	// has to return true or false
		// the name of the sequence flow follows after "$".
		// if there is no name, an error is thrown 
    	return true;
	};

	exports.Is_it_ok_$nok = function(data) {
    	// has to return true or false
		// the name of the sequence flow follows after "$".
		// if there is no name, an error is thrown 
    	return false;
	};


![](https://raw.githubusercontent.com/e2ebridge/bpmn/master/examples/processes/exclusiveGateway.png)

**Note**: 
For each outgoing transition we have a condition handler that hast to evaluate synchronously. So if backend data are required, fetch them in the gateway callback.
Furthermore, BPMN does not specify the order of evaluating the flow conditions, so the implementer has to make sure, that only one operation returns `true`. Additionally, we ignore the condition expression. We consider this as part of the implementation.

Timer Events
============

Boundary Timer Events
---------------------

Boundary timer events are timeouts on the activity they are attached to. To implement timeouts use two handlers:

	exports.MyTimeout$getTimeout = function(data, done) {
    	// called when arriving on "MyTask"
		// should return timeout in ms.
    	return 1000;
	};

	exports.MyTimeout = function(data, done) {
    	// called if the timeout triggers
    	done(data);
	};

![](https://raw.githubusercontent.com/e2ebridge/bpmn/master/examples/processes/timeout.png)

Intermediate Timer Events
-------------------------
Intermediate catch timer events are used to stop the process for a given time. If the timer event occurs, the process proceeds. The implementation is very similar to boundary timer events:

	exports.MyTimeout$getTimeout = function(data, done) {
    	// called when arriving on "Intermediate Catch Timer Event"
		// should return wait time in ms.
    	return 10000;
	};

	exports.Intermediate_Catch_Timer_Event = function(data, done) {
    	// called if the timeout triggers
    	done(data);
	};

![](https://raw.githubusercontent.com/e2ebridge/bpmn/master/examples/processes/intermediateTimerEvent.png)


Collaborations
==============

BPMN also supports collaborating processes as depicted below.

![](https://raw.githubusercontent.com/e2ebridge/bpmn/master/examples/processes/collaboration.png)

These processes must be created together:

	// create collaborating processes
    bpmn.createUnmanagedCollaboratingProcesses("my/collaboration/example.bpmn", function(err, collaboratingProcesses){

        // start the second process
        var secondProcess = collaboratingProcesses[1];
        secondProcess.triggerEvent("Start Event 2");

    });

The collaboration of the processes is then implemented in the handlers. For example, it is possible to get a partner process by name and then send an event to this process. This is frequently done to start the partner process:

	exports.Task_2 = function(data, done) {
    	// after arriving ot "Task 2" we start process 1
    	var partnerProcess = this.getParticipantByName("My First Process");
    	partnerProcess.triggerEvent("Start Event 1");
    	done(data);
	};

However, another option is to get all outgoing message flows and send a message along these flows. In the current example we have exactly one flow, so sending the message is done by:

	exports.End_Event_1 = function(data, done) {
    	// after reaching the end of process 1, we send a message
    	var messageFlows = this.getOutgoingMessageFlows("End Event 1");
    	this.sendMessage(messageFlows[0], {gugus: "blah"});
    	done(data);
	};

Collaborating processes can also be created from strings using createUnmanagedCollaboratingProcessesFromXML(bpmnXML, handler, callback).

**Note**: all task and event names must be unique

Logging
=======
By default, only errors are logged. However, it is easy to change the log level:

	var logLevels = require('bpmn').logLevels;
	
	myProcess.setLogLevel(logLevels.debug);

It is also possible to use log level strings instead of the log level enumeration:

	myProcess.setLogLevel("debug");

Or within a handler:

	this.setLogLevel("trace");

By default, logs are written to the console and `./process.log`. Of course, this can be changed. For details see the section *Log Transports*.

The supported log levels are:

- **none**: switches logging off
- **error** (default): Errors, error handler calls, and default event handler calls are logged
- **trace**: process actions are logged: sendMessage, triggerEvent, callHandler, callHandlerDone, taskDone, catchBoundaryEvent
- **debug**: internal process actions are logged, such as putTokenAt, tokenArrivedAt, doneSaving, etc.
- **silly, verbose, info, warn**: these levels are reserved for further use but not yet implemented: 

Log Transports
--------------
We use [winston](https://github.com/flatiron/winston) as log library. This allows as to define different ways of storing our logs by defining so called winston transports (for details see [here](https://github.com/flatiron/winston/blob/master/docs/transports.md)). The default transports used by this library are

	transports: [
            new (winston.transports.Console)({
                colorize: true
            }),
            new (winston.transports.File)({
                level: 'verbose',
                filename: './process.log',
                maxsize: 64 * 1024 * 1024,
                maxFiles: 100,
                timestamp: function() {
                    return Date.now();
                }
            })
        ]

However, these transports can be overridden or completely new transports can be added. For example, the following code snippet adds a file transport used for errors, max size of one megabyte, and not writing timestamps:

	var winston = require('winston'); 
	myProcess.addLogTransport(winston.transports.File,
        {
            level: 'error',
            filename: "my/log/file.log",
            maxsize: 1024 * 1024,
            timestamp: false
        }
    );

**Note**: the directory containing the log file must exist, otherwise an error is thrown. 

Of course, transports can be removed as well, e.g.:

	bpmnProcess.removeLogTransport(winston.transports.File);

Managing processes
==================

Process managers are used to create multiple processes using the same definitions and find them back later.

    var manager = new bpmn.ProcessManager();

    manager.addBpmnFilePath("path/to/myProcess.bpmn");

    manager.createProcess("myId", function(err, myProcess){

        // we start the process
        myProcess.triggerEvent("MyStart");

    });

If the process id is already used an error is returned.

If the manager have multiple bpmn definitions a descriptor object must be passed to the create function.

    manager.createProcess({id: "myId", name: "MyProcess"}, function(err, myProcess){

        // we start the process
        myProcess.triggerEvent("MyStart");

    });

To create collaborating processes and array of descriptors must be passed to the create function.

    var processDescriptors = [
        {name: "My First Process", id: "myFirstProcessId_1"},
        {name: "My Second Process", id: "mySecondProcessId_1"}
    ];
    manager.createProcess(processDescriptors, function(err, collaboratingProcesses){

        var secondProcess = collaboratingProcesses[1];
        secondProcess.triggerEvent("Start Event 2");

    });


Process definitions and handlers can be add in the manager creator or using add* functions.

Creator options:

- **handlerFilePath**: Object with name and filePath. Can be an array of theses object to define multiple handlers.
    * **name**: The name of the process definition for which the handler will be used.
    * **filePath**: Path to the javascript file defining the handler module.
- **handlerString**: Object with name and string. Can be an array of theses object to define multiple handlers.
    * **name**: The name of the process definition for which the handler will be used.
    * **string**: The javascript string defining the handler module.
- **handler**: Object with name and module. Can be an array of theses object to define multiple handlers.
    * **name**: The name of the process definition for which the handler will be used.
    * **module**: The javascript object defining the handler module.

- **bpmnFilePath**: Path to the bpmn file. Can be an array to define multiple definitions. will try to load the handler from the corresponding javascript file.
- **bpmnXML**: Object with name and xml. Can be an array of theses object to define multiple definitions.
    * **name**: The name of the process definition.
    * **xml**: The xml string definition.


**Note**: If no handler is found for a process definition an error is thrown.

    var manager = new bpmn.ProcessManager({
        bpmnFilePath: "path/to/myProcess.bpmn"
    });



ProcessManager.addHandlerFilePath(name, handlerFilePath)

- **name**: The name of the process definition for which the handler will be used.
- **handlerFilePath**: Path to the javascript file defining the handler module.

ProcessManager.addHandlerString = function(name, handlerString)

- **name**: The name of the process definition for which the handler will be used.
- **handlerString**: The javascript string defining the handler module.

ProcessManager.addHandler = function(name, handler)

- **name**: The name of the process definition for which the handler will be used.
- **handlerString**: The javascript object defining the handler module.


ProcessManager.addBpmnFilePath = function(bpmnFilePath, processHandler)

- **bpmnFilePath**: Path to the bpmn file.
- **processHandler**: Optional. The javascript object defining the handler module or the path to the javascript file defining the handler module.

If no processHandler is passed we try to load the corresponding javascript file to the bpmn file. If no handler is found or defined before for this definition an error is thrown.


ProcessManager.addBpmnXML = function(bpmnXml, processName, processHandler)

- **bpmnXml**: The xml string definition.
- **processName**: The name of the process definition.
- **processHandler**: Optional. The javascript object defining the handler module or the javascript string defining the handler module.

If no processHandler is passed and no handler was defined before for this definition an error is thrown.


Finding processes
-----------------

Existing processes in a manager can be retrived using these functions:

	// returns the process with the corresponding id
	bpmn.get(processId, function(err, process){
        ...
	});

	// returns all processes
    bpmn.getAllProcesses(function(err, processes){
        ...
    });

	// returns all processes having the property names
	bpmn.findByProperty({propName1: propValue1, propName2: propValue2, ...}, function(err, processes){
        ...
    });

	// returns all processes in this state (callActivity, tasks, event, ...)
	bpmn.findByState(stateName, function(err, processes){
        ...
    });

	// returns all processes using this definition
	bpmn.findByName(definitionName, function(err, processes){
        ...
    });


Persistency
-----------

The manager constructor also takes persistency options. The engine will save the state while waiting for a task being done. After a manager is created with persistency options all stored processes can be retrived using the functions above. The process can be persisted to the file system or to a MongoDB. We recommend the latter approach for productive use cases.

    // using files
    var manager = new bpmn.ProcessManager({
        persistencyOptions: {
            uri: "path/to/folder"
        }
    });


    // using mongodb
    var manager = new bpmn.ProcessManager({
        persistencyOptions: {
            uri: "mongodb://host:port/db_name"
        }
    });


Main module is an instance of ProcessManager
--------------------------------------------

The main bpmn module is an instance of ProcessManager without options meaning you can use manager functions directly from it.

    var bpmn = require('bpmn');

    bpmn.addBpmnFilePath("path/to/myProcess.bpmn");

    bpmn.createProcess("myId", function(err, myProcess){

        // we start the process
        myProcess.triggerEvent("MyStart");

    });


REST
====

Server
------

The above API can also be called by REST HTTP calls. To do this, you have first to instantiate a server from ta manager. For example:

	// Returns a restify server.
	var server = manager.createServer();
	server.listen(9009, function() {
    	console.log('%s listening at %s', server.name, server.url);
	});

The server is a node restify server. So all features of this package can be used.
The full signature of `createProcess`  is

	var server = manager.createServer(options, restifyOptions);

The parameters are:

- **options**: optional object having the following optional properties
 	* **createProcessId**: Function that returns a UUID. Default: `node-uuid.v1()`
 	* **logLevel**: used log level. Default: Error. Use logger.logLevels to set.
- **restifyOptions**: these options are given to the restify.createServer call. If not given, the log property is set to the internal winston logger and the name property is set to 'bpmnRESTServer'.

Client
------

The following sections describe how a client would use the REST API provided by the server above. The API calls are illustrated using the [restify client library](http://mcavage.github.io/node-restify/#client-api).

**Creating a process**

To create a process send a `POST` request:

	// This example used the node-restify client
	var client = restify.createJsonClient({url: "http://localhost:9009"});

    client.post('/TaskExampleProcess', function(err, req, res, obj) { ... });

When receiving this request the server will use the `urlMap` to find the BPMN file associated with the process name in the URL, instantiate this process and return the process state in the response body as a JSON object:

	{
		"id": "3c5e28f0-cec1-11e2-b076-31b0fecf7b6f",
		"name": "TaskExampleProcess",
		"link": {
		    "rel": "self",
		    "href": "/TaskExampleProcess/3c5e28f0-cec1-11e2-b076-31b0fecf7b6f"
		},
		"state": [],
		"history": [],
		"properties": {}
	}

The process has now been created but not yet started! Thus, `state`, `history`, and `properties` are empty. To do this, you have either to send a start event using a PUT request (see below) or you can **create and start** the process in one go by appending the start event to the process URI:

       var message = {
			"gugus": "blah", // a process property ...
			"sugus": "foo", // and another one.
        };

        client.post('/TaskExampleProcess/MyStart', message, function(err, req, res, obj) { ... });

If the `MyStart` event handler sets a process property such as

	exports.MyStart = function(data, done) {
    	this.setProperty("myFirstProperty", data);
    	done(data);
	};

The result of above POST request may look like:

	{
	    "id": "3c5e28f0-cec1-11e2-b076-31b0fecf7b6f",
	    "name": "TaskExampleProcess",
	    "link": {
	        "rel": "self",
	        "href": "/TaskExampleProcess/3c5e28f0-cec1-11e2-b076-31b0fecf7b6f"
	    },
	    "state": [
	        {
	            "position": "MyTask",
	            "owningProcessId": "3c5e28f0-cec1-11e2-b076-31b0fecf7b6f"
	        }
	    ],
	    "history": [
	        {
	            "name": "MyStart"
	        },
	        {
	            "name": "MyTask"
	        }
	    ],
	    "properties": {
	        "myFirstProperty": {
	            "gugus": "blah",
				"sugus": "foo"
	        }
	    }
	}

**Note**: all REST request return either the process state or an array of process states.

**Getting the process state, history, and properties**

To the current state, history, and properties of process use

	client.get('/TaskExampleProcess/3c5e28f0-cec1-11e2-b076-31b0fecf7b6f', function(err, req, res, obj) {...});

The returned object is the same as in the last POST request. Following REST convetions, the operation giving all processes of a given type is

	client.get('/TaskExampleProcess', function(err, req, res, obj) {...});

Or if is also possible using query strings. For example, the following query returns all processes having property `x` containing the attribute `y` having the value `uvw`

	client.get('/TaskExampleProcess?x.y=uvw', function(err, req, res, obj) {...});

It is also possible to query processes executing a task, an activity, or waiting for an event to happen by sending the following request:

	client.get('/TaskExampleProcess?state=MyTask', function(err, req, res, obj) {...});

Of course, all queries can be combined in one request.

**Sending messages and triggering events**

Both is done by send a `PUT` request containing the send message or triggered event data as body:

	var data = {
        "gugus": "blah"
    };
	client.put('/TaskExampleProcess/myprocessid/MyStart/myeventid', data, function(err, req, res, obj) {...});

or 

	var message = {
        "gugus": "blah"
    };
	client.put('/TaskExampleProcess/myprocessid/MyStart/mymessageid', data, function(err, req, res, obj) {...});

BPMN
====

Supported Elements
-----------------------
- **Start events**: all kind of start events are mapped to the none start event. Any further specialization is then done in the implementation of the handler.
- **End events**: all kind of end events are mapped to the none end event. Any further specialization is then done in the implementation of the handler.
- **Gateways**: Parallel- and exclusive gateways are supported.
- **Task, User Task, Manual Task, Receive Task**: These tasks call an event handler when the task starts and then wait until `taskDone(taskName, data)` is invoked on the process.
- Service Task, Script Task, Business Rule Task, Send Task (Wait Tasks): These tasks call an event handler when the task starts and proceed immediately after the the handler finishes.
- **Throw Intermediate Events**: the handler is triggered when the intermediate event is reached. All types of intermediate events are treated the same.
- **Catch Intermediate Events**: the handler is triggered if the event is catched and not when it is reached. For example, if we have an intermediate catch message event, the handler is triggered when the message arrives. If we have an intermediate catch timer event, the handler is triggered when the timout occurs. However, in both cases, no handler is triggered when the intermediate event is reached.
- **Call Activity**: an external sub-process is called. The sub-process must not be a collaboration and must have exactly one start event.
- **Boundary Events**: message and timeout boundary elements are supported for all wait tasks (Task, User Task, Manual Task, Receive Task). The handler is triggered if the events occur.

Limitations 
-----------
- **Start events**: all kind of start events are mapped to the none start event. Any further specialization is then done in the implementation of the handler.
- **End events**: all kind of end events are mapped to the none end event. Any further specialization is then done in the implementation of the handler.
- **Gateway**s: only parallel- and exclusive gateways are supported yet.
- Data objects: are ignored by the engine


Licensing
---------

(The MIT License)

Copyright (c) 2014 [E2E Technologies Ltd](http://www.e2ebridge.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

by [E2E Technologies Ltd](http://www.e2ebridge.com)


Questions, comments, thoughts?
------------------------------
This is a very rough work in progress. 

Feel free to contact me at mrassinger@e2e.ch with questions or comments about this project.



