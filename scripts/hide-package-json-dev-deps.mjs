/* eslint-env node */

import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const packagesRoot = path.join(__dirname, "..", "packages");

const hide = process.argv[2] === "hide";

const packages = fs
    .readdirSync(packagesRoot)
    .filter(item => fs.lstatSync(path.join(packagesRoot, item)).isDirectory());

const sInternalPackageNames = new Set();

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");
    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());
    sInternalPackageNames.add(packageJSONData.name);
}

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");

    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());

    const deps = packageJSONData.dependencies;
    delete packageJSONData.dependencies;
    packageJSONData.dependencies = deps;

    if (hide) {
        packageJSONData.__devDependencies = {
            ...(packageJSONData.devDependencies || {}),
            ...(packageJSONData.__devDependencies || {})
        };
        delete packageJSONData.devDependencies;
    } else {
        packageJSONData.devDependencies = {
            ...(packageJSONData.devDependencies || {}),
            ...(packageJSONData.__devDependencies || {})
        };
        delete packageJSONData.__devDependencies;
    }

    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  ") + "\n");
}
