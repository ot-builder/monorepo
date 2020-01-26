import * as Path from "path";
import * as CP from "child_process";
import * as OS from "os";

const OsSuffix = OS.platform() === "win32" ? ".cmd" : "";

export const Deploy = Path.resolve(__dirname, "../../.doc-deploy");
export const Doc = Path.resolve(__dirname, "../../doc");
export const Build = Path.resolve(Doc, "build");
export const Out = Path.resolve(Doc, "out");

export const RepositoryDir = Path.resolve(__dirname, "../../");

export function Git(...args: string[]) {
    return Spawn("git", args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function Beachball(...args: string[]) {
    const beachBallExec = Path.resolve(__dirname, "../../node_modules/.bin/beachball" + OsSuffix);
    return Spawn(beachBallExec, args, { cwd: RepositoryDir, stdio: "inherit" });
}
export function Next(...args: string[]) {
    return Spawn(Path.resolve(__dirname, "../../node_modules/.bin/next" + OsSuffix), args, {
        cwd: Doc,
        stdio: "inherit"
    });
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
