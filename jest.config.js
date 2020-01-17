const os = require("os");

module.exports = {
    testEnvironment: "node",
    testMatch: ["**/packages/*/lib/**/*.test.js"],
    roots: ["packages/"],
    maxConcurrency: os.cpus().length // use how many processors you have
};
