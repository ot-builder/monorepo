import * as fs from "fs";
import * as path from "path";

const packagesRoot = path.join(__dirname, "..", "packages");

const packages = fs
    .readdirSync(packagesRoot)
    .filter(item => fs.lstatSync(path.join(packagesRoot, item)).isDirectory());

const sInternalPackageVersion: Map<string, string> = new Map();

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");
    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());
    sInternalPackageVersion.set(packageJSONData.name, packageJSONData.version);
}

console.log("Internal packages:");
console.log(
    Array.from(sInternalPackageVersion)
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([p, v]) => ` * ${p}: ${v}`)
        .join("\n")
);

for (const packageName of packages) {
    const packageJSONPath = path.join(packagesRoot, packageName, "package.json");
    const npmIgnorePath = path.join(packagesRoot, packageName, ".npmignore");

    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());

    delete packageJSONData.main;
    delete packageJSONData.types;
    delete packageJSONData.files;
    delete packageJSONData.publishConfig;
    delete packageJSONData.jest;

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

    const deps = packageJSONData.dependencies || {};
    for (const pkgName in deps) {
        const ver = sInternalPackageVersion.get(pkgName);
        if (ver) deps[pkgName] = ver;
    }
    delete packageJSONData.dependencies;
    packageJSONData.dependencies = deps;

    const devDeps = {
        ...(packageJSONData.devDependencies || {}),
        ...(packageJSONData.__devDependencies || {})
    };
    for (const pkgName in devDeps) {
        const ver = sInternalPackageVersion.get(pkgName);
        if (ver) devDeps[pkgName] = ver;
    }
    delete packageJSONData.devDependencies;
    packageJSONData.devDependencies = devDeps;

    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSONData, null, "  ") + "\n");
    fs.writeFileSync(
        npmIgnorePath,
        `tsconfig.json
tsconfig.prod.json
CHANGELOG.json
CHANGELOG.md
lib/**/*.map
src/
`
    );
}
