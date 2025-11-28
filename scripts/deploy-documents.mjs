/* eslint-env node */

import { docPublish } from "./publish-procs/doc-publish.mjs";

const GitUser = "otbbuilder-dev";
const GitEmail = "otbbuilder-dev@users.noreply.github.com";

main().catch(e => {
    console.error(e);
    process.exit(1);
});

async function main() {
    const cfg = { GitUser, GitEmail };
    await docPublish(cfg);
}
