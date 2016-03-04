"use strict";

const codeSign_1 = require("./codeSign");
const bluebird_1 = require("bluebird");
const awaiter_1 = require("./awaiter");
const platformPackager_1 = require("./platformPackager");
const path = require("path");
const util_1 = require("./util");
const promisifed_fs_1 = require("./promisifed-fs");
const fse = require("fs-extra");
const __awaiter = awaiter_1.tsAwaiter;
Array.isArray(__awaiter);
const emptyDir = bluebird_1.Promise.promisify(fse.emptyDir);
class WinPackager extends platformPackager_1.PlatformPackager {
    constructor(info, cleanupTasks) {
        super(info);
        this.isNsis = this.options.target != null && this.options.target.indexOf("nsis") !== -1;
        if (this.isNsis) {
            const iconPath = this.customDistOptions == null ? null : this.customDistOptions.icon;
            require("../lib/win").copyAssetsToTmpFolder(iconPath || path.join(this.buildResourcesDir, "icon.ico"));
        }
        if (this.options.cscLink != null && this.options.cscKeyPassword != null && process.platform !== "darwin") {
            this.certFilePromise = codeSign_1.downloadCertificate(this.options.cscLink).then(path => {
                cleanupTasks.push(() => promisifed_fs_1.deleteFile(path, true));
                return path;
            });
        } else {
            this.certFilePromise = bluebird_1.Promise.resolve(null);
        }
    }
    getBuildConfigurationKey() {
        return "win";
    }
    pack(platform, outDir, appOutDir, arch) {
        if (this.options.dist && !this.isNsis) {
            const installerOut = this.computeDistOut(outDir, arch);
            util_1.log("Removing %s", installerOut);
            return bluebird_1.Promise.all([super.pack(platform, outDir, appOutDir, arch), emptyDir(installerOut)]);
        } else {
            return super.pack(platform, outDir, appOutDir, arch);
        }
    }
    computeDistOut(outDir, arch) {
        return path.join(outDir, (this.isNsis ? "nsis" : "win") + (arch === "x64" ? "-x64" : ""));
    }
    packageInDistributableFormat(outDir, appOutDir, arch) {
        return __awaiter(this, void 0, Promise, function* () {
            let iconUrl = this.metadata.build.iconUrl;
            if (!iconUrl) {
                if (this.customDistOptions != null) {
                    iconUrl = this.customDistOptions.iconUrl;
                }
                if (!iconUrl) {
                    if (this.info.repositoryInfo != null) {
                        const info = yield this.info.repositoryInfo.getInfo(this);
                        if (info != null) {
                            iconUrl = `https://raw.githubusercontent.com/${ info.user }/${ info.project }/master/${ this.relativeBuildResourcesDirname }/icon.ico`;
                        }
                    }
                    if (!iconUrl) {
                        throw new Error("iconUrl is not specified, please see https://github.com/loopline-systems/electron-builder#in-short");
                    }
                }
            }
            const certificateFile = yield this.certFilePromise;
            const version = this.metadata.version;
            const installerOutDir = this.computeDistOut(outDir, arch);
            const appName = this.metadata.name;
            const archSuffix = arch === "x64" ? "-x64" : "";
            const installerExePath = path.join(installerOutDir, appName + "Setup-" + version + archSuffix + ".exe");
            const options = Object.assign({
                name: this.metadata.name,
                appDirectory: appOutDir,
                outputDirectory: installerOutDir,
                productName: appName,
                version: version,
                description: this.metadata.description,
                authors: this.metadata.author.name,
                iconUrl: iconUrl,
                setupIcon: path.join(this.buildResourcesDir, "icon.ico"),
                certificateFile: certificateFile,
                certificatePassword: this.options.cscKeyPassword,
                fixUpPaths: false
            }, this.customDistOptions);
            if (this.isNsis) {
                return yield this.nsis(options, installerExePath);
            }
            try {
                yield require("electron-winstaller-temp-fork").createWindowsInstaller(options);
            } catch (e) {
                if (!(e.message.indexOf("Unable to set icon") !== -1)) {
                    throw e;
                } else {
                    let fileInfo;
                    try {
                        fileInfo = yield promisifed_fs_1.stat(options.setupIcon);
                    } catch (e) {
                        throw new Error("Please specify correct setupIcon, file " + options.setupIcon + " not found");
                    }
                    if (fileInfo.isDirectory()) {
                        throw new Error("Please specify correct setupIcon, " + options.setupIcon + " is a directory");
                    }
                }
            }
            const promises = [promisifed_fs_1.renameFile(path.join(installerOutDir, "Setup.exe"), installerExePath).then(it => this.dispatchArtifactCreated(it)), promisifed_fs_1.renameFile(path.join(installerOutDir, appName + "-" + version + "-full.nupkg"), path.join(installerOutDir, appName + "-" + version + archSuffix + "-full.nupkg")).then(it => this.dispatchArtifactCreated(it))];
            if (arch === "x64") {
                this.dispatchArtifactCreated(path.join(installerOutDir, "RELEASES"));
            } else {
                promises.push(promisifed_fs_1.copyFile(path.join(installerOutDir, "RELEASES"), path.join(installerOutDir, "RELEASES-ia32")).then(it => this.dispatchArtifactCreated(it)));
            }
            return yield bluebird_1.Promise.all(promises);
        });
    }
    nsis(options, installerFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const build = require("../lib/win").init().build;
            yield emptyDir(options.outputDirectory);
            return yield bluebird_1.Promise.promisify(build)(Object.assign(options, {
                log: console.log,
                appPath: options.appDirectory,
                out: options.outputDirectory,
                platform: "win32",
                outFile: installerFile,
                copyAssetsToTmpFolder: false,
                config: {
                    win: Object.assign({
                        title: options.name,
                        version: options.version,
                        icon: options.setupIcon,
                        publisher: options.authors,
                        verbosity: 2
                    }, this.customDistOptions)
                }
            }));
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WinPackager;
//# sourceMappingURL=winPackager.js.map