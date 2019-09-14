import * as fs from "fs";
import * as path from "path";

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
    delete packageJSONData.types;
    delete packageJSONData.files;
    delete packageJSONData.publishConfig;

    packageJSONData.main = "./lib/index.js";
    packageJSONData.types = "./lib/index.d.ts";
    packageJSONData.files = ["lib/**/*.js", "lib/**/*.json", "lib/**/*.d.ts"];
    packageJSONData.scripts = {
        build: "tsc -b ./tsconfig.package.json",
        clean: "rimraf lib .cache",
        test: "jest --passWithNoTests"
    };
    if (!packageJSONData.private) {
        packageJSONData.publishConfig = { access: "public" };
    }
    packageJSONData.jest = { testMatch: ["**/*.test.js"], rootDir: "lib/" };

    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  "));
}
