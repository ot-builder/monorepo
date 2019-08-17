import * as fs from "fs";
import * as path from "path";

const lernaJsonRoot = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "lerna.json"), "utf-8")
);

const packagesRoot = path.join(__dirname, "..", "packages");

const packages = fs
    .readdirSync(packagesRoot)
    .filter(item => fs.lstatSync(path.join(packagesRoot, item)).isDirectory());

let sInternalPackageNames: Set<string> = new Set();

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");
    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());
    sInternalPackageNames.add(packageJSONData.name);
}

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");

    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());

    delete packageJSONData.main;
    delete packageJSONData.version;
    delete packageJSONData.types;
    delete packageJSONData.files;

    packageJSONData.main = "./lib/index.js";
    packageJSONData.version = lernaJsonRoot.version;
    packageJSONData.types = "./lib/index.d.ts";
    packageJSONData.files = ["lib/**/*.js", "lib/**/*.json", "lib/**/*.d.ts"];
    packageJSONData.scripts = {
        build: "tsc -b ./tsconfig.package.json",
        clean: "rimraf lib .cache",
        test: "jest --passWithNoTests"
    };
    packageJSONData.publishConfig = {
        access: "public"
    };
    packageJSONData.jest = { testMatch: ["**/*.test.js"], rootDir: "lib/" };
    if (packageJSONData.dependencies) {
        for (let k in packageJSONData.dependencies) {
            if (sInternalPackageNames.has(k)) {
                packageJSONData.dependencies[k] = lernaJsonRoot.version;
            }
        }
    }
    if (packageJSONData.devDependencies) {
        for (let k in packageJSONData.devDependencies) {
            if (sInternalPackageNames.has(k)) {
                packageJSONData.devDependencies[k] = lernaJsonRoot.version;
            }
        }
    }

    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  "));
}
