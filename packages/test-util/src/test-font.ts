import * as fs from "fs";
import * as path from "path";

export function get(name: string) {
    return fs.readFileSync(path.resolve(__dirname, "../../../test-fonts/" + name));
}
