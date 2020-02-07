import { CONSOLE_WIDTH, AnsiRegex } from "./style";

export class CliHelpShower {
    constructor(private readonly indentPrefix = "", private readonly bulletPrefix = "") {}
    indent(bullet = "") {
        return new CliHelpShower(this.indentPrefix + "  ", bullet);
    }
    message(...text: (string | null | undefined)[]) {
        const words = text
            .filter(t => !!t)
            .map(t => (t ? t.split(" ") : []))
            .reduce((a, b) => [...a, ...b], []);
        this.messageImpl(words);

        return this;
    }
    private messageImpl(words: string[]) {
        const prefix = this.indentPrefix + this.bulletPrefix;
        const prefixLength = prefix.length;
        const prefixSpaces = " ".repeat(prefixLength);
        const availableWidth = CONSOLE_WIDTH - prefixLength;

        let c = 0,
            line = "";
        process.stderr.write(this.indentPrefix + this.bulletPrefix);
        for (const word of words) {
            const wordColumns = word.replace(AnsiRegex, "").length;
            if (!line) {
                line += word;
                c = wordColumns;
            } else if (c + 1 + wordColumns < availableWidth) {
                line += " " + word;
                c += 1 + wordColumns;
            } else {
                process.stderr.write(line + "\n" + prefixSpaces);
                line = word;
                c = wordColumns;
            }
        }
        if (line) process.stderr.write(line);
        process.stderr.write("\n");
    }
    private measureColumns(word: string) {
        return word.replace(AnsiRegex, "").length;
    }
}
