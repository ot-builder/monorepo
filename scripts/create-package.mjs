/* eslint-env node */

import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const packagesRoot = path.join(__dirname, "..", "packages");
const packageName = process.argv[2];

fs.mkdirSync(path.join(packagesRoot, packageName));
fs.mkdirSync(path.join(packagesRoot, packageName, "src"));

const packageJSONPath = path.join(packagesRoot, packageName, "package.json");

const packageJSONData = {
    name: `@ot-builder/${packageName}`,
    version: "0.0.0",
    license: "MIT",
    repository: {
        type: "git",
        url: "https://github.com/ot-builder/monorepo.git",
        directory: `packages/${packageName}`
    },
    main: "./lib/index.js",
    types: "./lib/index.d.ts",
    files: ["lib", "src"],
    dependencies: {
        tslib: "^2.0.0"
    },
    devDependencies: {
        jest: "^29.6.2",
        "@types/jest": "^29.5.5"
    },
    scripts: {
        build: "tsc -b ./tsconfig.package.json",
        clean: "rimraf lib .cache",
        prepublish: "npm run build",
        test: "jest --passWithNoTests"
    },
    publishConfig: {
        access: "public"
    }
};

fs.writeFileSync(path.join(packagesRoot, packageName, "src", "index.ts"), `export default {}`);

fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  "));
fs.writeFileSync(path.join(packagesRoot, packageName, ".npmrc"), `package-lock=false`);
fs.writeFileSync(
    path.join(packagesRoot, packageName, "src", ".npmignore"),
    `tsconfig.json
tsconfig.prod.json
CHANGELOG.json
CHANGELOG.md
lib/**/*.map
src/
`
);
