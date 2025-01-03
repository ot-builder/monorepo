export default {
    testEnvironment: "node",
    testMatch: ["**/packages/*/lib/**/!(-)*.test.js"],
    roots: ["packages/"],
    testTimeout: 600_000 // 10 mins
};
