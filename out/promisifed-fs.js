"use strict";

const fs = require("fs-extra");
const bluebird_1 = require("bluebird");
const readFileAsync = bluebird_1.Promise.promisify(fs.readFile);
function readText(file) {
    return readFileAsync(file, "utf8");
}
exports.readText = readText;
function deleteFile(path) {
    let ignoreIfNotExists = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    return new bluebird_1.Promise((resolve, reject) => {
        fs.unlink(path, it => it == null || ignoreIfNotExists && it.code === "ENOENT" ? resolve(null) : reject(it));
    });
}
exports.deleteFile = deleteFile;
function renameFile(oldPath, newPath) {
    return new bluebird_1.Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, error => error == null ? resolve(newPath) : reject(error));
    });
}
exports.renameFile = renameFile;
function copyFile(src, dest) {
    return new bluebird_1.Promise((resolve, reject) => {
        fs.copy(src, dest, error => error == null ? resolve(dest) : reject(error));
    });
}
exports.copyFile = copyFile;
const statFileAsync = bluebird_1.Promise.promisify(fs.stat);
function stat(path) {
    return statFileAsync(path);
}
exports.stat = stat;
//# sourceMappingURL=promisifed-fs.js.map