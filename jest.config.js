/* eslint global-require: "off" */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env es6,node */

const os = require("os");

module.exports = {
    testEnvironment: "node",
    testMatch: ["**/packages/*/lib/**/!(-)*.test.js"],
    roots: ["packages/"],
    maxConcurrency: os.cpus().length // use how many processors you have
};
