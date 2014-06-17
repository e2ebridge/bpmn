/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var sax = require('sax');
var fs = require('fs');
var path = require('path');
var fileUtils = require('../utils/file.js');
var utils = require('../utils/utils.js');
var debug = require('../debugger.js');
var processDefinition = require('./processDefinition.js');
var tasks = require('./tasks.js');
var startEvents = require('./startEvents.js');
var boundaryEvents = require('./boundaryEvents.js');
var endEvents = require('./endEvents.js');
var sequenceFlows = require('./sequenceFlows.js');
var gateways = require('./gateways.js');
var callActivity = require('./callActivity.js');
var events = require('./events.js');
var intermediateEvents = require('./intermediateEvents.js');
var subProcess = require('./subProcess.js');
var messageFlows = require("./messageFlows.js");
var participant = require("./participant.js");
var collaborationDefinition = require("./collaborationDefinition.js");
var parserUtils = require("./parserUtils");

var BPMN2NAMESPACE = "http://www.omg.org/spec/BPMN/20100524/MODEL";

/**
 * @param {Object} prefix2NamespaceMap Maps prefixes to namespaces. ASSUMPTION: prefixes map uniquely to namespaces
 * @param node
 */
function addNamespaces(prefix2NamespaceMap, node) {
    var attributes = node.attributes;
    if (attributes) {
        var keys = Object.keys(attributes);
        keys.forEach(function(key) {
            var attribute = attributes[key];
            if (attribute.prefix === "xmlns") {
                // NOTE: we assume that namespace prefixes are unique - which is not necessarily true
                prefix2NamespaceMap[attribute.local] = attribute.value;
            }
        });
    }
}

/**
 * @param {Object} importNamespace2LocationMap Maps import namespaces to locations.
 * @param importNode
 */
function addImport(importNamespace2LocationMap, importNode) {
    var location = parserUtils.getAttributesValue(importNode, "location");
    var namespace = parserUtils.getAttributesValue(importNode, "namespace");
    importNamespace2LocationMap[namespace] = location;
}


/**
 * @param {String} bpmnXML
 * @param {BPMNParseErrorQueue=} errorQueue
 * @param {String=} mainProcessName
 * @param {String=} fileName
 * @return {Array.<BPMNProcessDefinition>}
 */
exports.parse = function(bpmnXML, errorQueue, mainProcessName, fileName) {

    var parser = sax.parser(true, {"xmlns": true});
    var topLevelDefinitions = [];
    var processStack = [];
    /** @type {BPMNProcessDefinition} */
    var subProcessDefinition = null;
    /** @type {BPMNProcessDefinition} */
    var currentProcessDefinition = null;
    /** @type {BPMNFlowObject|BPMNSequenceFlow} */
    var currentProcessElement = null;
    /** @type {BPMNCollaborationDefinition} */
    var currentCollaborationDefinition = null;
    /** @type {BPMNMessageFlow|BPMNParticipant} */
    var currentCollaborationElement = null;
    var prefix2NamespaceMap = {};
    var importNamespace2LocationMap = {};
    var debuggerInterface = null;

    if (errorQueue && fileName) {
        errorQueue.fileName = fileName;
    }

    parser.onerror = function (e) {
        errorQueue.addError("NOPARSE", {}, e.message);
        parser.resume();
    };

    parser.onopentag = function (node) {
        var localName = node.local;
        var inBPMN2Namespace = node.uri === BPMN2NAMESPACE;

        addNamespaces(prefix2NamespaceMap, node);

        if (!debuggerInterface && debug.isDebuggerElement(node) && fileName) {
            debuggerInterface = debug.createDebuggerInterface(node, fileName);
        }

        if (inBPMN2Namespace) {

            if (collaborationDefinition.isCollaborationDefinitionName(localName)) {
                currentCollaborationDefinition = collaborationDefinition.createBPMNCollaborationDefinition(node);
                topLevelDefinitions.push(currentCollaborationDefinition);
                currentProcessDefinition = null;
            }

            if (currentCollaborationDefinition) {
                if (messageFlows.isMessageFlowName(localName)) {
                    currentCollaborationElement = messageFlows.createBPMNMessageFlow(node);
                    currentCollaborationDefinition.addMessageFlow(currentCollaborationElement);
                } else if (participant.isParticipantName(localName)) {
                    currentCollaborationElement = participant.createBPMNParticipant(node);
                    currentCollaborationDefinition.addParticipant(currentCollaborationElement);
                }
            }

            if (processDefinition.isProcessName(localName)) {
                if (processDefinition.isExecutable(node)) {
                    currentProcessDefinition = processDefinition.createBPMNProcessDefinition(node, debuggerInterface);
                    if (!currentProcessDefinition.name && mainProcessName) {
                        currentProcessDefinition.name = mainProcessName;
                    }
                    topLevelDefinitions.push(currentProcessDefinition);
                    currentCollaborationDefinition = null;
                } else {
                    currentProcessDefinition = null;
                }
            }

            if (localName === "import") {
                addImport(importNamespace2LocationMap, node);
            }

            if (currentProcessDefinition) {
                if (tasks.isTaskName(localName)) {
                    currentProcessElement = tasks.createBPMNTask(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (sequenceFlows.isSequenceFlowName(localName)) {
                    currentProcessElement = sequenceFlows.createBPMNSequenceFlow(node);
                    currentProcessDefinition.addSequenceFlow(currentProcessElement);
                } else if (startEvents.isStartEventName(localName)) {
                    currentProcessElement = startEvents.createBPMNStartEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (boundaryEvents.isBoundaryEventName(localName)) {
                    currentProcessElement = boundaryEvents.createBPMNBoundaryEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (boundaryEvents.isTimerEventName(localName)) {
                    currentProcessElement.isTimerEvent = true;
                } else if (endEvents.isEndEventName(localName)) {
                    currentProcessElement = endEvents.createBPMNEndEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (gateways.isGatewayName(localName)) {
                    currentProcessElement = gateways.createBPMNGateway(node, errorQueue);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (callActivity.isCallActivityName(localName)) {
                    currentProcessElement = callActivity.createBPMNCallActivity(node, fileName, prefix2NamespaceMap, importNamespace2LocationMap);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (intermediateEvents.isIntermediateThrowEventName(localName)) {
                    currentProcessElement = intermediateEvents.createBPMNIntermediateThrowEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (intermediateEvents.isIntermediateCatchEventName(localName)) {
                    currentProcessElement = intermediateEvents.createBPMNIntermediateCatchEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (events.isMessageEventName(localName)) {
                    currentProcessElement.isMessageEvent = true;
                } else if (subProcess.isSubProcessName(localName)) {
                    subProcessDefinition = processDefinition.createBPMNProcessDefinition(node, errorQueue);
                    currentProcessElement = subProcess.createBPMNSubProcess(node, subProcessDefinition);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                    processStack.push(currentProcessDefinition);
                    currentProcessDefinition = subProcessDefinition;
                }
            }
        }
    };

    parser.onclosetag = function (node) {
        if (subProcess.isSubProcessName(node)) {
            if (processStack.length > 0) {
                currentProcessDefinition = processStack.pop();
            }
        }
    };

    parser.write(bpmnXML).close();

    return topLevelDefinitions;
};
