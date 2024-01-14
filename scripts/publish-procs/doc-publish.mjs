/* eslint-env node */

import * as fs from "fs";
import * as path from "path";

import * as fse from "fs-extra";
import { rimraf } from "rimraf";

import { DocBuild, Deploy, DocGit, Npm } from "./tools.mjs";

export async function docPublish(cfg) {
    if (!cfg.GitUser || !cfg.GitEmail) {
        throw new Error("Key information missing.");
    }

    await fse.ensureDir(Deploy);

    // Build
    await Npm("run", "docs:clean");
    await Npm("run", "docs:build");

    // Repository
    await DocGit("config", "user.name", cfg.GitUser);
    await DocGit("config", "user.email", cfg.GitEmail);

    // Clear everything currently there
    await rimraf(path.join(Deploy, "*").replaceAll(path.sep, "/"), { glob: true });
    // Add ".nojekyll"
    await fs.promises.writeFile(path.resolve(Deploy, ".nojekyll"), "");
    // Copy doc output
    await fse.copy(DocBuild, Deploy);
    await rimraf(DocBuild);

    // Commit and push
    await DocGit("add", "-A");
    await DocGit("commit", "-m", `Documentation deploy @ ${new Date()}`);
    await DocGit("push", "origin", "master", "--force");
}
