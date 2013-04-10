/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var saxModule = require('sax');
var fsModule = require('fs');
var pathModule = require('path');
var fileUtilsModule = require('../utils/file.js');
var utilsModule = require('../utils/utils.js');
var processDefinitionModule = require('./processDefinition.js');
var tasksModule = require('./tasks.js');
var startEventsModule = require('./startEvents.js');
var endEventsModule = require('./endEvents.js');
var sequenceFlowsModule = require('./sequenceFlows.js');
var gatewaysModule = require('./gateways.js');
var processElementModule = require("./flowObject.js");

var BPMN2NAMESPACE = "http://www.omg.org/spec/BPMN/20100524/MODEL";

/**
 * @param {String} fileName
 * @param {ErrorQueue} errorQueue
 * @return {{processes: Array.<BPMNProcessDefinition>}}
 */
function parse(fileName, errorQueue) {
    var bpmnXML = fsModule.readFileSync(fileName, "utf8");
    var parser = saxModule.parser(true, {"xmlns": true});

    var processes = [];
    /** @type {BPMNProcessDefinition} */
    var currentProcess = null;
    /** @type {BPMNTask|BPMNStartEvent|BPMNEndEvent|BPMNSequenceFlow|BPMNExclusiveGateway} */
    var currentProcessElement = null;
    var isOutgoingRef = false;
    var isIncomingRef = false;

    parser.onerror = function (e) {
            errorQueue.addError(
            "ParseBPMN",
            fileName,
            e.message);
        parser.resume();
    };

    parser.ontext = function (text) {
        if (isOutgoingRef) {
            currentProcessElement.addOutgoingRef(text);
            isOutgoingRef = false;
        } else if (isIncomingRef) {
            currentProcessElement.addIncomingRef(text);
            isIncomingRef = false;
        }
    };

    parser.onopentag = function (node) {
        var localName = node.local;

        var inBPMN2Namespace = node.uri === BPMN2NAMESPACE;

        if (inBPMN2Namespace) {
            if (processDefinitionModule.isProcessName(localName)) {
                currentProcess = processDefinitionModule.getBPMNProcess(node, errorQueue);
                if (!currentProcess.name) {
                    var baseFileName = fileUtilsModule.removeFileExtension(pathModule.basename(fileName));
                    currentProcess.name = utilsModule.toUpperCamelCase(baseFileName);
                }
                processes.push(currentProcess);
            }

            if (currentProcess) {
                if (tasksModule.isTaskName(localName)) {
                    currentProcessElement = tasksModule.createBPMNTask(node);
                    currentProcess.addTask(currentProcessElement);
                } else if (sequenceFlowsModule.isSequenceFlowName(localName)) {
                    currentProcessElement = sequenceFlowsModule.createBPMNSequenceFlow(node);
                    currentProcess.addSequenceFlow(currentProcessElement);
                } else if (startEventsModule.isStartEventName(localName)) {
                    currentProcessElement = startEventsModule.createBPMNStartEvent(node);
                    currentProcess.addStartEvent(currentProcessElement);
                } else if (endEventsModule.isEndEventName(localName)) {
                    currentProcessElement = endEventsModule.createBPMNEndEvent(node);
                    currentProcess.addEndEvent(currentProcessElement);
                } else if (gatewaysModule.isExclusiveGatewayName(localName)) {
                    currentProcessElement = gatewaysModule.createBPMNExclusiveGateway(node);
                    currentProcess.addGateway(currentProcessElement);
                } else if (gatewaysModule.isParallelGatewayName(localName)) {
                    currentProcessElement = gatewaysModule.createBPMNParallelGateway(node);
                    currentProcess.addGateway(currentProcessElement);
                } else if (processElementModule.isOutgoingRefName(localName)) {
                    isOutgoingRef = true;
                } else if (processElementModule.isIncomingRefName(localName)) {
                    isIncomingRef = true;
                }
            }
        }
    };

    parser.write(bpmnXML).close();

    return processes;
}
exports.parse = parse;
