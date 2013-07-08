/**
 * Copyright: E2E Technologies Ltd
 */
"use strict";

var fs = require('fs');
var nfs = require('node-fs/lib/fs.js');
var paths = require('path');

var encoding = "utf8";

/**
 * Create directories recursively if they don't exist
 * @param {String} path
 */
exports.writeDirSync = function(path){
   nfs.mkdirSync(path, "0777", true);
};

/**
 * @param {String} name
 * @param {String} data
 */
exports.writeFileSync = function(name, data){
    fs.writeFileSync(name, data, encoding);
};

/**
 *
 * @param {String} fileName
 * @return {String}
 */
exports.getFileExtension = function(fileName) {
    var extension = null;
    var index = fileName.lastIndexOf(".");
    if (index > -1) {
        extension = fileName.substring(index + 1);
    }
    return extension;
};

/**
 *
 * @param {string} fileName
 * @return {string}
 */
exports.removeFileExtension = function(fileName) {
    var name = fileName;
    var index = name.lastIndexOf(".");
    if (index > -1) {
        name = name.substring(0, index);
    }
    return name;
};

/**
 *
 * @param {string} currentPath
 * @param {function(currentPath:string, fileName:string, currentFile:string)} handleFile
 */
var traverseFileSystem = exports.traverseFileSystem = function (currentPath, handleFile) {
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
};

/**
 * @param {string} path
 * @param {string} name
 */
var concatFSNames = exports.concatFSNames = function(path, name) {
    //return (path.substr(0, 1) === '/' ? path + name : path + '/' + name);
    return paths.join(path, name);
};

exports.readJSONObject = function(fileName) {
    var fileContents = fs.readFileSync(fileName, encoding);
    return JSON.parse(fileContents);
};

/**
 * Returns lines separated by \n as string array. Mainly used for testing.
 * @param fileName
 * @return {Array.<String>}
 */
exports.readLines = function(fileName) {
    var fileContents = fs.readFileSync(fileName, encoding);
    return fileContents.split(/\r?\n/);
};

/**
 * @param {string} path
 */
exports.removeDirectorySync = function(path) {
    fs.rmdirSync(path);
};

/**
 * @param {String} path
 * @param {String} fileName
 */
var removeFileSync = exports.removeFileSync = function(path, fileName) {
    var filePath = concatFSNames(path, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

/**
 * @param {string} path
 */
exports.cleanDirectorySync = function(path) {
    traverseFileSystem(path, removeFileSync);
};

/**
 * @param {String} dirtyPath
 * @return {String}
 */
exports.cleanPath = function(dirtyPath) {
    return dirtyPath.replace(/[:!`~\^@*#¢¬ç?¦\|&;\$%@"<>\(\){}\[\]\+, \t\n]/g, "");
};