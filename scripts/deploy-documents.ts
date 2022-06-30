import { docPublish } from "./publish-procs/doc-publish";
import { PublishConfig } from "./publish-procs/tools";

const GitUser = "otbbuilder-dev";
const GitEmail = "otbbuilder-dev@users.noreply.github.com";

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    const cfg: PublishConfig = { GitUser, GitEmail, NpmToken: "" };
    await docPublish(cfg);
}
