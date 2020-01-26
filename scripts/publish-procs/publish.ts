import { Beachball, Git, PublishConfig } from "./tools";

export async function publish(cfg: PublishConfig) {
    // Setup Git
    const repoUrl = `https://${cfg.GitUser}:${cfg.GitToken}@github.com/ot-builder/monorepo.git`;

    await Git("config", "user.name", cfg.GitUser);
    await Git("config", "user.email", cfg.GitEmail);
    await Git("remote", "set-url", "origin", repoUrl);

    // Do the publish
    await Beachball("publish", "--yes", "-n", cfg.NpmToken);
}
