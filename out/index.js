"use strict";

const platforms = require("./platforms");
const path = require("path");
const fse = require("fs-extra");
var packager_1 = require("./packager");
exports.Packager = packager_1.Packager;
const Builder = {
    build: function (options, callback) {
        options = options || {};
        options.log = options.log || console.log;
        options.out = options.out ? path.resolve(process.cwd(), options.out) : process.cwd();
        options.log("- Running electron-builder " + require("../package").version);
        if (options.out[options.out.length - 1] !== path.sep) {
            options.out += path.sep;
        }
        if (!fse.existsSync(options.out)) {
            options.log("- Output directory ´" + options.out + "´ does not exist ");
            fse.mkdirsSync(options.out);
            options.log(`- Created '${ options.out }`);
        }
        if (!options.appPath || !options.platform || !options.config || !options.basePath) {
            return callback(new Error("Required option not set"));
        }
        if (!options.config[options.platform]) {
            return callback(new Error("No config property found for `" + options.platform + "`.\n" + "Please check your configuration file and the documentation."));
        }
        options.appPath = path.resolve(options.appPath);
        try {
            platforms(options.platform).init().build(options, callback);
        } catch (error) {
            return callback(error);
        }
    }
};
function init() {
    return Object.create(Builder);
}
exports.init = init;
//# sourceMappingURL=index.js.map