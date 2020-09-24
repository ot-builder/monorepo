import { CONSOLE_WIDTH } from "./style";

// From strip-ansi
const AnsiPattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
].join("|");

const AnsiRegex = new RegExp(AnsiPattern, "g");

export class CliHelpShower {
    constructor(
        private readonly indentPrefix = "",
        private readonly bulletPrefix = "",
        private readonly hangingIndentPrefix = ""
    ) {}
    public indent(bullet = "") {
        return new CliHelpShower(this.indentPrefix + "  ", bullet, this.hangingIndentPrefix);
    }
    public withIndent(bullet: string, fn: (s: CliHelpShower) => void) {
        fn(this.indent(bullet));
        return this;
    }
    public hangingIndent(s = "  ") {
        return new CliHelpShower(
            this.indentPrefix,
            this.bulletPrefix,
            this.hangingIndentPrefix + s
        );
    }
    public message(...text: (string | null | undefined)[]) {
        const words = text
            .filter(t => !!t)
            .map(t => (t ? t.split(" ") : []))
            .reduce((a, b) => [...a, ...b], []);
        this.messageImpl(words);

        return this;
    }
    private messageImpl(words: string[]) {
        const prefixFirstLine = this.indentPrefix + this.bulletPrefix;
        const prefixContinueLine = " ".repeat(prefixFirstLine.length) + this.hangingIndentPrefix;
        let availableWidth = CONSOLE_WIDTH - prefixFirstLine.length;

        let c = 0,
            line = "";
        process.stderr.write(prefixFirstLine);
        for (const word of words) {
            const wordColumns = this.measureColumns(word);
            if (!line) {
                line += word;
                c = wordColumns;
            } else if (c + 1 + wordColumns < availableWidth) {
                line += " " + word;
                c += 1 + wordColumns;
            } else {
                process.stderr.write(line + "\n" + prefixContinueLine);
                availableWidth = CONSOLE_WIDTH - prefixContinueLine.length;
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

export * as Style from "./style";
