"use strict";

const path = require("path");
const bluebird_1 = require("bluebird");
const awaiter_1 = require("./awaiter");
const linux_1 = require("../lib/linux");
const platformPackager_1 = require("./platformPackager");
const tmp_1 = require("tmp");
const util_1 = require("./util");
const __awaiter = awaiter_1.tsAwaiter;
Array.isArray(__awaiter);
const buildDeb = bluebird_1.Promise.promisify(linux_1.init().build);
const tmpDir = bluebird_1.Promise.promisify(tmp_1.dir);
class LinuxPackager extends platformPackager_1.PlatformPackager {
    constructor(info) {
        super(info);
        if (this.options.dist && (this.customDistOptions == null || this.customDistOptions.desktopTemplate == null)) {
            this.desktopIcons = this.computeDesktopIconPath();
        } else {
            this.desktopIcons = bluebird_1.Promise.resolve(null);
        }
    }
    computeDesktopIconPath() {
        return __awaiter(this, void 0, Promise, function* () {
            const tempDir = yield tmpDir({
                unsafeCleanup: true,
                prefix: "png-icons"
            });
            const outputs = yield util_1.exec("icns2png", ["-x", "-o", tempDir, path.join(this.buildResourcesDir, "icon.icns")]);
            if (!(outputs[0].toString().indexOf("ih32") !== -1)) {
                util_1.log("48x48 is not found in the icns, 128x128 will be resized");
                yield new bluebird_1.Promise((resolve, reject) => {
                    require("gm")(path.join(tempDir, "icon_128x128x32.png")).resize(48, 48).write(path.join(tempDir, "icon_48x48x32.png"), error => error == null ? resolve() : reject(error));
                });
            }
            const appName = this.metadata.name;
            function createMapping(size) {
                return `${ tempDir }/icon_${ size }x${ size }x32.png=/usr/share/icons/hicolor/${ size }x${ size }/apps/${ appName }.png`;
            }
            return [createMapping("16"), createMapping("32"), createMapping("48"), createMapping("128"), createMapping("256"), createMapping("512")];
        });
    }
    getBuildConfigurationKey() {
        return "linux";
    }
    packageInDistributableFormat(outDir, appOutDir, arch) {
        return __awaiter(this, void 0, Promise, function* () {
            const specification = {
                version: this.metadata.version,
                title: this.metadata.name,
                comment: this.metadata.description,
                maintainer: `${ this.metadata.author.name } <${ this.metadata.author.email }>`,
                arch: arch === "ia32" ? 32 : 64,
                target: "deb",
                executable: this.metadata.name,
                desktop: `[Desktop Entry]
      Name=${ this.metadata.name }
      Comment=${ this.metadata.description }
      Exec=${ this.metadata.name }
      Terminal=false
      Type=Application
      Icon=${ this.metadata.name }
      `,
                dirs: yield this.desktopIcons
            };
            if (this.customDistOptions != null) {
                Object.assign(specification, this.customDistOptions);
            }
            return yield buildDeb({
                log: function emptyLog() {},
                appPath: appOutDir,
                out: outDir,
                config: {
                    linux: specification
                }
            }).then(it => this.dispatchArtifactCreated(it));
        });
    }
}
exports.LinuxPackager = LinuxPackager;
//# sourceMappingURL=linuxPackager.js.map