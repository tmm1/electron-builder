"use strict";

const fs = require("fs");
const path = require("path");
const util_1 = require("./util");
const promise_1 = require("./promise");
const events_1 = require("events");
const bluebird_1 = require("bluebird");
const awaiter_1 = require("./awaiter");
const errorMessages = require("./errorMessages");
const util = require("util");
const __awaiter = awaiter_1.tsAwaiter;
Array.isArray(__awaiter);
function addHandler(emitter, event, handler) {
    emitter.on(event, handler);
}
class Packager {
    constructor(options) {
        let repositoryInfo = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        this.options = options;
        this.repositoryInfo = repositoryInfo;
        this.isTwoPackageJsonProjectLayoutUsed = true;
        this.eventEmitter = new events_1.EventEmitter();
        this.projectDir = options.projectDir == null ? process.cwd() : path.resolve(options.projectDir);
        this.appDir = this.computeAppDirectory();
    }
    artifactCreated(handler) {
        addHandler(this.eventEmitter, "artifactCreated", handler);
        return this;
    }
    get devPackageFile() {
        return path.join(this.projectDir, "package.json");
    }
    build() {
        return __awaiter(this, void 0, Promise, function* () {
            const buildPackageFile = this.devPackageFile;
            const appPackageFile = this.projectDir === this.appDir ? buildPackageFile : path.join(this.appDir, "package.json");
            const platforms = normalizePlatforms(this.options.platform);
            yield bluebird_1.Promise.all(Array.from(new Set([buildPackageFile, appPackageFile]), util_1.readPackageJson)).then(result => {
                this.metadata = result[result.length - 1];
                if (this.metadata.productName) {
                    this.metadata.name = this.metadata.productName;
                }
                this.devMetadata = result[0];
                this.checkMetadata(appPackageFile, platforms);
                this.electronVersion = util_1.getElectronVersion(this.devMetadata, buildPackageFile);
            });
            const cleanupTasks = [];
            return promise_1.executeFinally(this.doBuild(platforms, cleanupTasks), error => promise_1.all(cleanupTasks.map(it => it())));
        });
    }
    doBuild(platforms, cleanupTasks) {
        return __awaiter(this, void 0, Promise, function* () {
            const distTasks = [];
            for (let platform of platforms) {
                const helper = this.createHelper(platform, cleanupTasks);
                for (let arch of normalizeArchs(platform, this.options.arch)) {
                    yield this.installAppDependencies(arch);
                    const outDir = path.join(this.projectDir, "dist");
                    const appOutDir = path.join(outDir, this.metadata.name + "-" + platform + "-" + arch);
                    yield helper.pack(platform, outDir, appOutDir, arch);
                    if (this.options.dist) {
                        distTasks.push(helper.packageInDistributableFormat(outDir, appOutDir, arch));
                    }
                }
            }
            return yield bluebird_1.Promise.all(distTasks);
        });
    }
    createHelper(platform, cleanupTasks) {
        switch (platform) {
            case "darwin":
            case "osx":
                {
                    const helperClass = require("./macPackager").default;
                    return new helperClass(this, cleanupTasks);
                }
            case "win32":
            case "win":
            case "windows":
                {
                    const helperClass = require("./winPackager").default;
                    return new helperClass(this, cleanupTasks);
                }
            case "linux":
                return new (require("./linuxPackager").LinuxPackager)(this);
            default:
                throw new Error("Unsupported platform: " + platform);
        }
    }
    computeAppDirectory() {
        let customAppPath = this.options.appDir;
        let required = true;
        if (customAppPath == null) {
            customAppPath = util_1.DEFAULT_APP_DIR_NAME;
            required = false;
        }
        const absoluteAppPath = path.join(this.projectDir, customAppPath);
        try {
            fs.accessSync(absoluteAppPath);
        } catch (e) {
            if (required) {
                throw new Error(customAppPath + " doesn't exists, " + e.message);
            } else {
                this.isTwoPackageJsonProjectLayoutUsed = false;
                return this.projectDir;
            }
        }
        return absoluteAppPath;
    }
    checkMetadata(appPackageFile, platforms) {
        const reportError = missedFieldName => {
            throw new Error("Please specify '" + missedFieldName + "' in the application package.json ('" + appPackageFile + "')");
        };
        const metadata = this.metadata;
        if (metadata.name == null) {
            reportError("name");
        } else if (metadata.description == null) {
            reportError("description");
        } else if (metadata.version == null) {
            reportError("version");
        } else if (metadata.build == null) {
            throw new Error(util.format(errorMessages.buildIsMissed, appPackageFile));
        } else {
            const author = metadata.author;
            if (author == null) {
                reportError("author");
            } else if (this.options.dist && author.email == null && platforms.indexOf("linux") !== -1) {
                throw new Error(util.format(errorMessages.authorEmailIsMissed, appPackageFile));
            }
        }
    }
    installAppDependencies(arch) {
        if (this.isTwoPackageJsonProjectLayoutUsed) {
            return util_1.installDependencies(this.appDir, arch, this.electronVersion);
        } else {
            util_1.log("Skipping app dependencies installation because dev and app dependencies are not separated");
            return bluebird_1.Promise.resolve(null);
        }
    }
}
exports.Packager = Packager;
function normalizeArchs(platform, arch) {
    return platform === "darwin" ? ["x64"] : arch == null || arch === "all" ? ["ia32", "x64"] : [arch];
}
exports.normalizeArchs = normalizeArchs;
function normalizePlatforms(platforms) {
    if (platforms == null || platforms.length === 0) {
        return [process.platform];
    } else if (platforms[0] === "all") {
        if (process.platform === "darwin") {
            return ["darwin", "linux", "win32"];
        } else if (process.platform === "linux") {
            return ["linux", "win32"];
        } else {
            return ["win32"];
        }
    } else {
        return platforms;
    }
}
exports.normalizePlatforms = normalizePlatforms;
//# sourceMappingURL=packager.js.map