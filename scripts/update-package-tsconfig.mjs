/* eslint-env node */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

const PACKAGE_TSCONFIG = "tsconfig.json";
const PACKAGE_TSCONFIG_PROD = "tsconfig.prod.json";
const PROJECT_TSCONFIG = "tsconfig.json";
const PROJECT_TSCONFIG_PROD = "tsconfig.prod.json";
const TSCONFIG_COMMENT = `// GENERATED by update-package-tsconfig\n// DO NOT EDIT THIS FILE\n`;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const packagesRoot = path.join(__dirname, "..", "packages");
const packageDirectories = fs
    .readdirSync(packagesRoot)
    .filter(item => fs.lstatSync(path.join(packagesRoot, item)).isDirectory());

function hashString(s) {
    const h = crypto.createHash("sha256");
    h.update(s);
    return h.digest("hex");
}

const packageJSONMap = new Map();

const packageDirnameMap = new Map();

packageDirectories.forEach(packageDirname => {
    const packageJSONPath = path.join(packagesRoot, packageDirname, "package.json");
    const packageJSONData = JSON.parse(fs.readFileSync(packageJSONPath).toString());
    const packageName = packageJSONData.name;
    packageDirnameMap.set(packageName, packageDirname);
    packageJSONMap.set(packageName, packageJSONData);
});

const internalDependencyMap = new Map();
packageDirnameMap.forEach((packageDirname, packageName) => {
    const { dependencies, devDependencies } = packageJSONMap.get(packageName);

    const internalDependencies = [
        ...(dependencies ? Object.keys(dependencies) : []),
        ...(devDependencies ? Object.keys(devDependencies) : [])
    ].filter(dep => packageDirnameMap.has(dep));

    internalDependencyMap.set(packageName, internalDependencies);
});

function resolveInternalDependencies(dependencies) {
    const childDeps = [];

    for (const iDep of dependencies) {
        const deps = internalDependencyMap.get(iDep);
        const res = resolveInternalDependencies(deps);
        for (const jDep of res) {
            childDeps.push(jDep);
        }
    }
    const resolved = childDeps.concat(dependencies);
    // remove all duplicated after the first appearance
    return resolved.filter((item, idx) => resolved.indexOf(item) === idx);
}

packageDirnameMap.forEach((packageDirname, packageName) => {
    const tsconfigPath = path.join(packagesRoot, packageDirname, PACKAGE_TSCONFIG);
    const tsconfigProdPath = path.join(packagesRoot, packageDirname, PACKAGE_TSCONFIG_PROD);

    const internalDependencies = resolveInternalDependencies(
        internalDependencyMap.get(packageName)
    );

    const devConfig = {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
            outDir: "./lib",
            rootDir: "./src",
            composite: true,
            tsBuildInfoFile: `../../.cache/${hashString(packageName)}`
        },
        references: internalDependencies.map(dep => {
            return { path: `../${packageDirnameMap.get(dep)}/${PACKAGE_TSCONFIG}` };
        })
    };
    const prodConfig = {
        ...devConfig,
        include: ["src/**/*"],
        exclude: ["node_modules", "**/*.test.ts"],
        references: internalDependencies.map(dep => {
            return { path: `../${packageDirnameMap.get(dep)}/${PACKAGE_TSCONFIG_PROD}` };
        })
    };
    fs.writeFileSync(tsconfigPath, TSCONFIG_COMMENT + JSON.stringify(devConfig, null, "  "));
    fs.writeFileSync(tsconfigProdPath, TSCONFIG_COMMENT + JSON.stringify(prodConfig, null, "  "));
});

const projectLevelTsconfigPath = path.join(packagesRoot, PROJECT_TSCONFIG);
const projectLevelTsconfigProdPath = path.join(packagesRoot, PROJECT_TSCONFIG_PROD);

const projectLevelTsconfigData = {
    files: [],
    references: resolveInternalDependencies(Array.from(packageDirnameMap.keys())).map(
        packageName => ({
            path: `./${packageDirnameMap.get(packageName)}/${PACKAGE_TSCONFIG}`
        })
    )
};
const projectLevelTsconfigProdData = {
    files: [],
    references: resolveInternalDependencies(Array.from(packageDirnameMap.keys())).map(
        packageName => ({
            path: `./${packageDirnameMap.get(packageName)}/${PACKAGE_TSCONFIG_PROD}`
        })
    )
};

fs.writeFileSync(
    projectLevelTsconfigPath,
    TSCONFIG_COMMENT + JSON.stringify(projectLevelTsconfigData, null, "  ")
);
fs.writeFileSync(
    projectLevelTsconfigProdPath,
    TSCONFIG_COMMENT + JSON.stringify(projectLevelTsconfigProdData, null, "  ")
);
