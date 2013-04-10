/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var fs = require('fs');
var nfs = require('node-fs/lib/fs.js');
var pathModule = require('path');
var utilsModule = require("./utils.js");

var encoding = "utf8";

/**
 * Create directories recursively if they don't exist
 * @param {String} path
 */
function writeDirSync(path){
    //noinspection OctalIntegerJS
    nfs.mkdirSync(path, 0777, true);
}
exports.writeDirSync = writeDirSync;

/**
 * @param {String} name
 * @param {String} data
 */
function writeFileSync(name, data){
    fs.writeFileSync(name, data, encoding);
}
exports.writeFileSync = writeFileSync;

/**
 *
 * @param {String} fileName
 * @return {String}
 */
function getFileExtension (fileName) {
    var extension = null;
    var index = fileName.lastIndexOf(".");
    if (index > -1) {
        extension = fileName.substring(index + 1);
    }
    return extension;
}
exports.getFileExtension = getFileExtension;

/**
 *
 * @param {string} fileName
 * @return {string}
 */
function removeFileExtension (fileName) {
    var name = fileName;
    var index = name.lastIndexOf(".");
    if (index > -1) {
        name = name.substring(0, index);
    }
    return name;
}
exports.removeFileExtension = removeFileExtension;

/**
 *
 * @param {string} currentPath
 * @param {function(currentPath:string, fileName:string, currentFile:string)} handleFile
 */
var traverseFileSystem = function (currentPath, handleFile) {
    var i;
    var files = fs.readdirSync(currentPath);

    for (i = 0; i < files.length; i++){
        var fileName = files[i];
        var currentFile = currentPath + '/' + fileName;
        var stats = fs.statSync(currentFile);
        if (stats.isFile()) {
            handleFile(currentPath, fileName, currentFile);
        }
        else if (stats.isDirectory()) {
            traverseFileSystem(currentFile, handleFile);
        }
    }
};
exports.traverseFileSystem = traverseFileSystem;

/**
 * @param {string} path
 * @param {string} name
 */
function concatFSNames(path, name) {
    //return (path.substr(0, 1) === '/' ? path + name : path + '/' + name);
    return pathModule.join(path, name);
}
exports.concatFSNames = concatFSNames;

function readJSONObject(fileName) {
    var fileContents = fs.readFileSync(fileName, encoding);
    return JSON.parse(fileContents);
}
exports.readJSONObject = readJSONObject;

/**
 * Returns lines separated by \n as string array. Mainly used for testing.
 * @param fileName
 * @return {Array.<String>}
 */
function readLines(fileName) {
    var fileContents = fs.readFileSync(fileName, encoding);
    return utilsModule.splitLines(fileContents);
}
exports.readLines = readLines;

/**
 * @param {string} path
 */
function removeDirectorySync(path) {
    fs.rmdirSync(path);
}
exports.removeDirectorySync = removeDirectorySync;

/**
 * @param {String} path
 * @param {String} fileName
 */
function removeFileSync(path, fileName) {
    fs.unlinkSync(concatFSNames(path, fileName));
}
exports.removeFileSync = removeFileSync;

/**
 * @param {string} path
 */
function cleanDirectorySync(path) {
    traverseFileSystem(path, removeFileSync);
}
exports.cleanDirectorySync = cleanDirectorySync;

/**
 * @param {String} dirtyPath
 * @return {String}
 */
function cleanPath(dirtyPath) {
    return dirtyPath.replace(/[:!`~\^@*#¢¬ç?¦\|&;\$%@"<>\(\){}\[\]\+, \t\n]/g, "");
}
exports.cleanPath = cleanPath;