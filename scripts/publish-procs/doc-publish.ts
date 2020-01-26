import * as Path from "path";
import * as FS from "fs-extra";
import * as RimRaf from "rimraf";
import { Build, Deploy, Git, Next, Out, PublishConfig } from "./tools";

export async function docPublish(cfg: PublishConfig) {
    // Build
    RimRaf.sync(Build);
    await Next("build");

    // Deploy
    RimRaf.sync(Deploy);
    await FS.mkdir(Deploy);

    // Repository
    const DocRemote = cfg.GitToken
        ? `https://${cfg.GitUser}:${cfg.GitToken}@github.com/ot-builder/ot-builder.github.io.git`
        : "https://github.com/ot-builder/ot-builder.github.io.git";
    await Git("init");
    await Git("remote", "add", "origin", DocRemote);
    await Git("config", "user.name", cfg.GitUser);
    await Git("config", "user.email", cfg.GitEmail);
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
