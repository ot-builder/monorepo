import { docPublish } from "./publish-procs/doc-publish";
import { publish } from "./publish-procs/publish";
import { PublishConfig } from "./publish-procs/tools";

const GitUser = "otbbuilder-dev";
const GitEmail = "otbbuilder-dev@users.noreply.github.com";
const GitToken = process.env.SECRET_GITHUB_TOKEN;
const NpmToken = process.env.SECRET_NPM_TOKEN;

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    if (!GitToken || !NpmToken) {
        console.error("Attempt to execute publish action on a fork. Exit.");
        return;
    } else {
        const cfg: PublishConfig = { GitUser, GitEmail, GitToken, NpmToken };
        await publish(cfg);
        await docPublish(cfg);
    }
}
