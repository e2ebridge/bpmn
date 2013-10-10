/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var nodeunit = require('nodeunit');
var program = require('commander');
var fs = require('fs');

var files = [];
var paths = ["."];
var reporter;
var options = {
        "error_prefix": "\u001B[31m",
        "error_suffix": "\u001B[39m",
        "ok_prefix": "\u001B[32m",
        "ok_suffix": "\u001B[39m",
        "bold_prefix": "\u001B[1m",
        "bold_suffix": "\u001B[22m",
        "assertion_prefix": "\u001B[35m",
        "assertion_suffix": "\u001B[39m"
};

program
    .version('0.0.1')
    .usage('[options] <path 1> <path 2> ...')
    .option('-r, --reporter [reporter]',
        'Reporter ["default"]: default, junit, skip_passed, minimal, html, eclipse, machineout, tap, nested, verbose',
        "default")
    .option('-o, --output [output directory]', 'Output directory required by some reporters ["nodeunit-output"]',
        "nodeunit-output")
    .parse(process.argv);


reporter = nodeunit.reporters[program.reporter];
reporter = reporter || nodeunit.reporters["default"];

options.output = program.output;

paths = program.args || paths;

paths.forEach(function(path) {
    traverseFileSystem(path, function(path, fileName, file) {
        if (file.match(/\.test\.js$/g)) {
            files.push(file);
        }
    });
});

if (files.length > 0) {
    reporter.run(files, options, function(err) {
        if (err) {
            process.exit(1);
        }
    });
} else {
    console.log("Did not find any test files.");
}

/**
 *
 * @param {string} currentPath
 * @param {function(currentPath:string, fileName:string, currentFile:string)} handleFile
 */
function traverseFileSystem(currentPath, handleFile) {
    var fileNames;
    if (fs.existsSync(currentPath)) {
        fileNames = fs.readdirSync(currentPath);
        fileNames.forEach(function(fileName) {
            var currentFile = currentPath + '/' + fileName;
            var stats = fs.statSync(currentFile);
            if (stats.isFile()) {
                handleFile(currentPath, fileName, currentFile);
            }
            else if (stats.isDirectory()) {
                traverseFileSystem(currentFile, handleFile);
            }
        });
    }
}