/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var saxModule = require('sax');
var fsModule = require('fs');
var pathModule = require('path');
var fileUtilsModule = require('../utils/file.js');
var utilsModule = require('../utils/utils.js');
var debuggerModule = require('../debugger.js');
var processDefinitionModule = require('./processDefinition.js');
var tasksModule = require('./tasks.js');
var startEventsModule = require('./startEvents.js');
var boundaryEventsModule = require('./boundaryEvents.js');
var endEventsModule = require('./endEvents.js');
var sequenceFlowsModule = require('./sequenceFlows.js');
var gatewaysModule = require('./gateways.js');
var callActivityModule = require('./callActivity.js');
var eventsModule = require('./events.js');
var intermediateEventsModule = require('./intermediateEvents.js');
var subProcessModule = require('./subProcess.js');
var messageFlowModule = require("./messageFlows.js");
var participantModule = require("./participant.js");
var collaborationDefinitionModule = require("./collaborationDefinition.js");
var parserUtilsModule = require("./parserUtils");

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
    var location = parserUtilsModule.getAttributesValue(importNode, "location");
    var namespace = parserUtilsModule.getAttributesValue(importNode, "namespace");
    importNamespace2LocationMap[namespace] = location;
}

/**
 * @param {String} fileName
 * @param {BPMNParseErrorQueue=} errorQueue
 * @return {Array.<BPMNProcessDefinition>}
 */
function parse(fileName, errorQueue) {

    var bpmnXML = fsModule.readFileSync(fileName, "utf8");
    var parser = saxModule.parser(true, {"xmlns": true});

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

    if (errorQueue) {
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

        if (!debuggerInterface && debuggerModule.isDebuggerElement(node)) {
            debuggerInterface = debuggerModule.createDebuggerInterface(node, fileName);
        }

        if (inBPMN2Namespace) {

            if (collaborationDefinitionModule.isCollaborationDefinitionName(localName)) {
                currentCollaborationDefinition = collaborationDefinitionModule.createBPMNCollaborationDefinition(node);
                topLevelDefinitions.push(currentCollaborationDefinition);
                currentProcessDefinition = null;
            }

            if (currentCollaborationDefinition) {
                if (messageFlowModule.isMessageFlowName(localName)) {
                    currentCollaborationElement = messageFlowModule.createBPMNMessageFlow(node);
                    currentCollaborationDefinition.addMessageFlow(currentCollaborationElement);
                } else if (participantModule.isParticipantName(localName)) {
                    currentCollaborationElement = participantModule.createBPMNParticipant(node, fileName);
                    currentCollaborationDefinition.addParticipant(currentCollaborationElement);
                }
            }

            if (processDefinitionModule.isProcessName(localName)) {
                if (processDefinitionModule.isExecutable(node)) {
                    currentProcessDefinition = processDefinitionModule.createBPMNProcessDefinition(node, debuggerInterface);
                    if (!currentProcessDefinition.name) {
                        var baseFileName = fileUtilsModule.removeFileExtension(pathModule.basename(fileName));
                        currentProcessDefinition.name = utilsModule.toUpperCamelCase(baseFileName);
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
                if (tasksModule.isTaskName(localName)) {
                    currentProcessElement = tasksModule.createBPMNTask(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (sequenceFlowsModule.isSequenceFlowName(localName)) {
                    currentProcessElement = sequenceFlowsModule.createBPMNSequenceFlow(node);
                    currentProcessDefinition.addSequenceFlow(currentProcessElement);
                } else if (startEventsModule.isStartEventName(localName)) {
                    currentProcessElement = startEventsModule.createBPMNStartEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (boundaryEventsModule.isBoundaryEventName(localName)) {
                    currentProcessElement = boundaryEventsModule.createBPMNBoundaryEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (boundaryEventsModule.isTimerEventName(localName)) {
                    currentProcessElement.isTimerEvent = true;
                } else if (endEventsModule.isEndEventName(localName)) {
                    currentProcessElement = endEventsModule.createBPMNEndEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (gatewaysModule.isGatewayName(localName)) {
                    currentProcessElement = gatewaysModule.createBPMNGateway(node, errorQueue);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (callActivityModule.isCallActivityName(localName)) {
                    currentProcessElement = callActivityModule.createBPMNCallActivity(node, fileName, prefix2NamespaceMap, importNamespace2LocationMap);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (intermediateEventsModule.isIntermediateThrowEventName(localName)) {
                    currentProcessElement = intermediateEventsModule.createBPMNIntermediateThrowEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (intermediateEventsModule.isIntermediateCatchEventName(localName)) {
                    currentProcessElement = intermediateEventsModule.createBPMNIntermediateCatchEvent(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (eventsModule.isMessageEventName(localName)) {
                    currentProcessElement.isMessageEvent = true;
                } else if (subProcessModule.isSubProcessName(localName)) {
                    subProcessDefinition = processDefinitionModule.createBPMNProcessDefinition(node, errorQueue);
                    currentProcessElement = subProcessModule.createBPMNSubProcess(node, subProcessDefinition);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                    processStack.push(currentProcessDefinition);
                    currentProcessDefinition = subProcessDefinition;
                }
            }
        }
    };

    parser.onclosetag = function (node) {
        if (subProcessModule.isSubProcessName(node)) {
            if (processStack.length > 0) {
                currentProcessDefinition = processStack.pop();
            }
        }
    };

    parser.write(bpmnXML).close();

    return topLevelDefinitions;
}
exports.parse = parse;
