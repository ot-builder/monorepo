/* eslint-env node */

import * as child_process from "child_process";
import * as is from "os";
import * as path from "path";
import * as url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// eslint-disable-next-line import/no-extraneous-dependencies
import which from "which";

const OsSuffix = is.platform() === "win32" ? ".cmd" : "";

export const RepositoryDir = path.resolve(__dirname, "../../");

export const Deploy = path.resolve(RepositoryDir, ".doc-deploy");
export const Doc = path.resolve(RepositoryDir, "doc");
export const DocBuild = path.resolve(Doc, ".build");

function npmExecutableDir(dir, packageName) {
    return path.resolve(dir, "node_modules/.bin/" + packageName + OsSuffix);
}
function npmExecutable(packageName) {
    return npmExecutableDir(RepositoryDir, packageName);
}

export function Git(...args) {
    return Spawn(which.sync("git"), args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function DocGit(...args) {
    return Spawn(which.sync("git"), args, { cwd: Deploy, stdio: "inherit" });
}
export function Beachball(...args) {
    return Spawn(npmExecutable("beachball"), args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function Next(...args) {
    return Spawn(npmExecutableDir(Doc, "next"), args, { cwd: Doc, stdio: "inherit" });
}
export function Npm(...args) {
    return Spawn(which.sync("npm"), args, { cwd: RepositoryDir, stdio: "inherit" });
}

export function Spawn(command, args, options) {
    return new Promise(function (resolve, reject) {
        const cp = child_process.spawn(command, args, options);

        cp.on("error", reject).on("close", function (code) {
            if (code === 0) {
                resolve(null);
            } else {
                reject(new Error("Child process " + command + "Exited with code " + code));
            }
        });
    });
}
