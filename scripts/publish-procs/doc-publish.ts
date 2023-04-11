import * as Path from "path";

import * as FSE from "fs-extra";
import { rimraf } from "rimraf";

import { Deploy, DocGit, Npm, Out, PublishConfig } from "./tools";

export async function docPublish(cfg: PublishConfig) {
    if (!cfg.GitUser || !cfg.GitEmail) {
        throw new Error("Key information missing.");
    }

    await FSE.ensureDir(Deploy);

    // Build
    await Npm("run", "docs:clean");
    await Npm("run", "docs:build");
    await Npm("run", "docs:export");

    // Repository
    await DocGit("config", "user.name", cfg.GitUser);
    await DocGit("config", "user.email", cfg.GitEmail);

    // Clear everything currently there
    await rimraf(Path.join(Deploy, "*"), { glob: true });
    // Add ".nojekyll"
    await FSE.writeFile(Path.resolve(Deploy, ".nojekyll"), "");
    // Copy doc output
    await FSE.copy(Out, Deploy);
    await rimraf(Out);

    // Commit and push
    await DocGit("add", ".");
    await DocGit("commit", "-m", `Documentation deploy @ ${new Date()}`);
    await DocGit("push", "origin", "master", "--force");
}
