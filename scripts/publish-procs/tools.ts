import * as Path from "path";
import * as CP from "child_process";
import * as OS from "os";

const OsSuffix = OS.platform() === "win32" ? ".cmd" : "";

export const RepositoryDir = Path.resolve(__dirname, "../../");

export const Deploy = Path.resolve(RepositoryDir, ".doc-deploy");
export const Doc = Path.resolve(RepositoryDir, "doc");
export const Build = Path.resolve(Doc, "build");
export const Out = Path.resolve(Doc, "out");

function npmExecutable(packageName: string) {
    return Path.resolve(RepositoryDir, "node_modules/.bin/" + packageName + OsSuffix);
}

export function Git(...args: string[]) {
    return Spawn("git", args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function DocGit(...args: string[]) {
    return Spawn("git", args, { cwd: Deploy, stdio: "inherit" });
}
export function Beachball(...args: string[]) {
    return Spawn(npmExecutable("beachball"), args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function Next(...args: string[]) {
    return Spawn(npmExecutable("next"), args, { cwd: Doc, stdio: "inherit" });
}

export function Spawn(command: string, args: string[], options: CP.SpawnOptions) {
    return new Promise(function(resolve, reject) {
        const cp = CP.spawn(command, args, options);

        cp.on("error", reject).on("close", function(code) {
            if (code === 0) {
                resolve(null);
            } else {
                reject(new Error("Child process " + command + "Exited with code " + code));
            }
        });
    });
}

export type PublishConfig = {
    GitUser: string;
    GitEmail: string;
    GitToken: string;
    NpmToken: string;
};
