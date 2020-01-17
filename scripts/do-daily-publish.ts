import * as CP from "child_process";
import * as OS from "os";
import * as Path from "path";

const OsSuffix = OS.platform() === "win32" ? ".cmd" : "";
const GitUser = "otbbuilder-dev";
const GitEmail = "otbbuilder-dev@users.noreply.github.com";
const GitToken = process.env.SECRET_GITHUB_TOKEN;
const NpmToken = process.env.SECRET_NPM_TOKEN;

const RepositoryDir = Path.resolve(__dirname, "../");

main().catch(e => {
    console.error(e);
    process.exit(1);
});

///////////////////////////////////////////////////////////////////////////////////////////////////

async function main() {
    if (!GitToken) throw new Error("Git token not configured. Exit.");
    if (!NpmToken) throw new Error("NPM token not configured. Exit.");

    // Setup Git
    const repoUrl = `https://${GitUser}:${GitToken}@github.com/ot-builder/monorepo.git`;

    await Git("config", "user.name", GitUser);
    await Git("config", "user.email", GitEmail);
    await Git("remote", "set-url", "origin", repoUrl);

    // Do the publish
    await Beachball("publish", "--yes", "-n", NpmToken);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function Git(...args: string[]) {
    return Spawn("git", args, { cwd: RepositoryDir, stdio: "inherit" });
}
function Beachball(...args: string[]) {
    const beachBallExec = Path.resolve(__dirname, "../node_modules/.bin/beachball" + OsSuffix);
    return Spawn(beachBallExec, args, { cwd: RepositoryDir, stdio: "inherit" });
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
