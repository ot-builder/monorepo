/* eslint-env node */

import * as fs from "fs";
import * as path from "path";

import * as fse from "fs-extra";
import { rimraf } from "rimraf";

import { Deploy, DocGit, Npm, Out } from "./tools.mjs";

export async function docPublish(cfg) {
    if (!cfg.GitUser || !cfg.GitEmail) {
        throw new Error("Key information missing.");
    }

    await fse.ensureDir(Deploy);

    // Build
    await Npm("run", "docs:clean");
    await Npm("run", "docs:build");
    await Npm("run", "docs:export");

    // Repository
    await DocGit("config", "user.name", cfg.GitUser);
    await DocGit("config", "user.email", cfg.GitEmail);

    // Clear everything currently there
    await rimraf(path.join(Deploy, "*"), { glob: true });
    // Add ".nojekyll"
    await fs.promises.writeFile(path.resolve(Deploy, ".nojekyll"), "");
    // Copy doc output
    await fse.copy(Out, Deploy);
    await rimraf(Out);

    // Commit and push
    await DocGit("add", "-A");
    await DocGit("commit", "-m", `Documentation deploy @ ${new Date()}`);
    await DocGit("push", "origin", "master", "--force");
}
