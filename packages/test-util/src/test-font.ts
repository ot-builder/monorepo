import * as fs from "node:fs";
import * as path from "node:path";

export function get(name: string) {
    return fs.readFileSync(path.resolve(__dirname, "../../../test-fonts/" + name));
}
