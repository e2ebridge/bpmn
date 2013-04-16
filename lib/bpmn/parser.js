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
var boundaryEventsModule = require('./boundaryEvents.js');
var endEventsModule = require('./endEvents.js');
var sequenceFlowsModule = require('./sequenceFlows.js');
var gatewaysModule = require('./gateways.js');

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
    var currentProcessDefinition = null;
    /** @type {BPMNFlowObject|BPMNSequenceFlow} */
    var currentProcessElement = null;

    parser.onerror = function (e) {
            errorQueue.addError(
            "ParseBPMN",
            fileName,
            e.message);
        parser.resume();
    };

    parser.onopentag = function (node) {
        var localName = node.local;

        var inBPMN2Namespace = node.uri === BPMN2NAMESPACE;

        if (inBPMN2Namespace) {
            if (processDefinitionModule.isProcessName(localName)) {
                currentProcessDefinition = processDefinitionModule.getBPMNProcessDefinition(node, errorQueue);
                if (!currentProcessDefinition.name) {
                    var baseFileName = fileUtilsModule.removeFileExtension(pathModule.basename(fileName));
                    currentProcessDefinition.name = utilsModule.toUpperCamelCase(baseFileName);
                }
                processes.push(currentProcessDefinition);
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
                } else if (gatewaysModule.isExclusiveGatewayName(localName)) {
                    currentProcessElement = gatewaysModule.createBPMNExclusiveGateway(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                } else if (gatewaysModule.isParallelGatewayName(localName)) {
                    currentProcessElement = gatewaysModule.createBPMNParallelGateway(node);
                    currentProcessDefinition.addFlowObject(currentProcessElement);
                }
            }
        }
    };

    parser.write(bpmnXML).close();

    return processes;
}
exports.parse = parse;
