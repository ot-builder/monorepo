/* eslint-env node */

import { Beachball, Git } from "./tools.mjs";

export async function publish(cfg) {
    if (!cfg.GitUser || !cfg.GitEmail) {
        throw new Error("Key information missing.");
    }

    // Setup Git
    await Git("config", "user.name", cfg.GitUser);
    await Git("config", "user.email", cfg.GitEmail);

    // Do the publish
    await Beachball("publish", "--access", "public", "--yes");
}
