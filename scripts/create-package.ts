import * as fs from "fs";
import * as path from "path";

const lernaJsonRoot = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "lerna.json"), "utf-8")
);

const packagesRoot = path.join(__dirname, "..", "packages");
const packageName = process.argv[2];

fs.mkdirSync(path.join(packagesRoot, packageName));
fs.mkdirSync(path.join(packagesRoot, packageName, "src"));

const packageJSONPath = path.join(packagesRoot, packageName, "package.json");

const packageJSONData = {
    name: `@ot-builder/${packageName}`,
    version: lernaJsonRoot.version,
    main: "./lib/index.js",
    types: "./lib/index.d.ts",
    files: ["lib", "src"],
    dependencies: {
        tslib: "^1.9.3"
    },
    devDependencies: {
        jest: "^24.8.0",
        "@types/jest": "^24.0.15"
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

fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  "));
fs.writeFileSync(path.join(packagesRoot, packageName, ".npmrc"), `package-lock=false`);
fs.writeFileSync(path.join(packagesRoot, packageName, "src", "index.ts"), `export default {}`);
