import * as fs from "fs";
import * as path from "path";

export async function getPackageVersion(): Promise<string> {
    const moduleDir = path.join(__dirname, "..");
    const json = JSON.parse(
        await fs.promises.readFile(path.join(moduleDir, "package.json"), "utf-8")
    );
    return json.version as string;
}
