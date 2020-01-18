import * as CP from "child_process";
import * as OS from "os";
import * as Path from "path";
import * as FS from "fs-extra";
import * as RimRaf from "rimraf";

const OsSuffix = OS.platform() === "win32" ? ".cmd" : "";

const Deploy = Path.resolve(__dirname, "../.doc-deploy");
const Doc = Path.resolve(__dirname, "../doc");
const Build = Path.resolve(Doc, "build");
const Out = Path.resolve(Doc, "out");

const GitUser = "otbbuilder-dev";
const GitEmail = "otbbuilder-dev@users.noreply.github.com";
const GitToken = process.env.SECRET_GITHUB_TOKEN;

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    // Build
    RimRaf.sync(Build);
    await Next("build");

    // Deploy
    RimRaf.sync(Deploy);
    await FS.mkdir(Deploy);

    // Repository
    const DocRemote = GitToken
        ? `https://${GitUser}:${GitToken}@github.com/ot-builder/ot-builder.github.io.git`
        : "https://github.com/ot-builder/ot-builder.github.io.git";
    await Git("init");
    await Git("remote", "add", "origin", DocRemote);
    await Git("config", "user.name", GitUser);
    await Git("config", "user.email", GitEmail);
    await Git("pull", "origin", "master");

    // CP.spawnSync(Git, ["pull", "origin"], { cwd: Out });
    RimRaf.sync(Out);
    await Next("export");

    // Clear everything currently there
    RimRaf.sync(Path.join(Deploy, "*"));
    // Add ".nojekyll"
    await FS.writeFile(Path.resolve(Deploy, ".nojekyll"), "");
    // Copy doc output
    await FS.copy(Out, Deploy);
    RimRaf.sync(Out);

    // Commit and push
    await Git("add", ".");
    await Git("commit", "-m", `Documentation deploy @ ${new Date()}`);
    await Git("push", "origin", "master", "--force");
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function Next(...args: string[]) {
    return Spawn(Path.resolve(__dirname, "../node_modules/.bin/next" + OsSuffix), args, {
        cwd: Doc,
        stdio: "inherit"
    });
}

function Git(...args: string[]) {
    return Spawn("git", args, { cwd: Deploy, stdio: "inherit" });
}

function Spawn(command: string, args: string[], options: CP.SpawnOptions) {
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
