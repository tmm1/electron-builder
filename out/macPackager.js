"use strict";

const platformPackager_1 = require("./platformPackager");
const path = require("path");
const bluebird_1 = require("bluebird");
const awaiter_1 = require("./awaiter");
const util_1 = require("./util");
const codeSign_1 = require("./codeSign");
const __awaiter = awaiter_1.tsAwaiter;
Array.isArray(__awaiter);
class MacPackager extends platformPackager_1.PlatformPackager {
    constructor(info, cleanupTasks) {
        super(info);
        if (this.options.cscLink != null && this.options.cscKeyPassword != null) {
            const keychainName = codeSign_1.generateKeychainName();
            cleanupTasks.push(() => codeSign_1.deleteKeychain(keychainName));
            this.codeSigningInfo = codeSign_1.createKeychain(keychainName, this.options.cscLink, this.options.cscKeyPassword);
        } else {
            this.codeSigningInfo = bluebird_1.Promise.resolve(null);
        }
    }
    getBuildConfigurationKey() {
        return "osx";
    }
    pack(platform, outDir, appOutDir, arch) {
        const _super = name => super[name];
        return __awaiter(this, void 0, Promise, function* () {
            yield _super("pack").call(this, platform, outDir, appOutDir, arch);
            let codeSigningInfo = yield this.codeSigningInfo;
            return yield this.signMac(path.join(appOutDir, this.metadata.name + ".app"), codeSigningInfo);
        });
    }
    signMac(distPath, codeSigningInfo) {
        if (codeSigningInfo == null) {
            codeSigningInfo = { cscName: this.options.sign || process.env.CSC_NAME };
        }
        if (codeSigningInfo.cscName == null) {
            util_1.log("App is not signed: CSC_LINK or CSC_NAME are not specified");
            return bluebird_1.Promise.resolve();
        } else {
            util_1.log("Signing app");
            return codeSign_1.sign(distPath, codeSigningInfo);
        }
    }
    packageInDistributableFormat(outDir, appOutDir) {
        const artifactPath = path.join(appOutDir, this.metadata.name + "-" + this.metadata.version + ".dmg");
        return bluebird_1.Promise.all([new bluebird_1.Promise((resolve, reject) => {
            util_1.log("Creating DMG");
            const specification = {
                title: this.metadata.name,
                icon: path.join(this.buildResourcesDir, "icon.icns"),
                "icon-size": 80,
                background: path.join(this.buildResourcesDir, "background.png"),
                contents: [{
                    "x": 410, "y": 220, "type": "link", "path": "/Applications"
                }, {
                    "x": 130, "y": 220, "type": "file"
                }]
            };
            if (this.customDistOptions != null) {
                Object.assign(specification, this.customDistOptions);
            }
            if (specification.title == null) {
                specification.title = this.metadata.name;
            }
            specification.contents[1].path = path.join(appOutDir, this.metadata.name + ".app");
            const emitter = require("appdmg")({
                target: artifactPath,
                basepath: this.projectDir,
                specification: specification
            });
            emitter.on("error", reject);
            emitter.on("finish", () => resolve());
        }).then(() => this.dispatchArtifactCreated(artifactPath)), this.zipMacApp(appOutDir).then(it => this.dispatchArtifactCreated(it))]);
    }
    zipMacApp(outDir) {
        util_1.log("Creating ZIP for Squirrel.Mac");
        const appName = this.metadata.name;
        const resultPath = `${ appName }-${ this.metadata.version }-mac.zip`;
        return util_1.spawn("zip", ["-ryXq", resultPath, appName + ".app"], {
            cwd: outDir,
            stdio: "inherit"
        }).thenReturn(outDir + "/" + resultPath);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MacPackager;
//# sourceMappingURL=macPackager.js.map