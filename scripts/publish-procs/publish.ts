import { Beachball, Git, PublishConfig } from "./tools";

export async function publish(cfg: PublishConfig) {
    if (!cfg.GitUser || !cfg.GitEmail || !cfg.NpmToken) {
        throw new Error("Key information missing.");
    }

    // Setup Git
    await Git("config", "user.name", cfg.GitUser);
    await Git("config", "user.email", cfg.GitEmail);

    // Do the publish
    await Beachball("publish", "--yes", "-n", cfg.NpmToken);
}
