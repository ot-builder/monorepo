import * as Path from "path";

import * as FSE from "fs-extra";
import * as RimRaf from "rimraf";

import { Build, Deploy, DocGit, Next, Out, PublishConfig } from "./tools";

export async function docPublish(cfg: PublishConfig) {
    if (!cfg.GitUser || !cfg.GitEmail) {
        throw new Error("Key information missing.");
    }

    // Build
    RimRaf.sync(Build);
    await Next("build");
    RimRaf.sync(Out);
    await Next("export");

    // Repository
    await DocGit("config", "user.name", cfg.GitUser);
    await DocGit("config", "user.email", cfg.GitEmail);

    // Clear everything currently there
    RimRaf.sync(Path.join(Deploy, "*"));
    // Add ".nojekyll"
    await FSE.writeFile(Path.resolve(Deploy, ".nojekyll"), "");
    // Copy doc output
    await FSE.copy(Out, Deploy);
    RimRaf.sync(Out);

    // Commit and push
    await DocGit("add", ".");
    await DocGit("commit", "-m", `Documentation deploy @ ${new Date()}`);
    await DocGit("push", "origin", "master", "--force");
}
