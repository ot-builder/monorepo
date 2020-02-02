export class CliHelpShower {
    constructor(private readonly indentPrefix = "", private readonly bulletPrefix = "") {}
    indent(bullet = "") {
        return new CliHelpShower(this.indentPrefix + "  ", bullet);
    }
    message(text: string) {
        process.stderr.write(this.indentPrefix + this.bulletPrefix + text + "\n");
        return this;
    }
}
