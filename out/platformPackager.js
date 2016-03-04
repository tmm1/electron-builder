"use strict";

const awaiter_1 = require("./awaiter");
const bluebird_1 = require("bluebird");
const path = require("path");
const packager = require("electron-packager-tf");
const __awaiter = awaiter_1.tsAwaiter;
Array.isArray(__awaiter);
const pack = bluebird_1.Promise.promisify(packager);
class PlatformPackager {
    constructor(info) {
        this.info = info;
        this.options = info.options;
        this.projectDir = info.projectDir;
        this.metadata = info.metadata;
        this.devMetadata = info.devMetadata;
        this.buildResourcesDir = path.resolve(this.projectDir, this.relativeBuildResourcesDirname);
        if (this.options.dist) {
            const buildMetadata = info.devMetadata.build;
            this.customDistOptions = buildMetadata == null ? buildMetadata : buildMetadata[this.getBuildConfigurationKey()];
        }
    }
    get relativeBuildResourcesDirname() {
        const directories = this.devMetadata.directories;
        return (directories == null ? null : directories.buildResources) || "build";
    }
    dispatchArtifactCreated(path) {
        this.info.eventEmitter.emit("artifactCreated", path);
    }
    pack(platform, outDir, appOutDir, arch) {
        const version = this.metadata.version;
        let buildVersion = version;
        const buildNumber = process.env.TRAVIS_BUILD_NUMBER || process.env.APPVEYOR_BUILD_NUMBER || process.env.CIRCLE_BUILD_NUM;
        if (buildNumber != null) {
            buildVersion += "." + buildNumber;
        }
        const options = Object.assign({
            dir: this.info.appDir,
            out: outDir,
            name: this.metadata.name,
            platform: platform,
            arch: arch,
            version: this.info.electronVersion,
            icon: path.join(this.buildResourcesDir, "icon"),
            asar: true,
            overwrite: true,
            "app-version": version,
            "build-version": buildVersion,
            "version-string": {
                CompanyName: this.metadata.author.name,
                FileDescription: this.metadata.description,
                ProductVersion: version,
                FileVersion: buildVersion,
                ProductName: this.metadata.name,
                InternalName: this.metadata.name
            }
        }, this.metadata.build, { "tmpdir": false });
        delete options.iconUrl;
        return pack(options);
    }
}
exports.PlatformPackager = PlatformPackager;
//# sourceMappingURL=platformPackager.js.map