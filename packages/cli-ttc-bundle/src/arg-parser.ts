export class ArgParser {
    inputs: string[] = [];
    output?: string;
    unify = false;
    sparse = false;
    displayHelp = false;

    private acceptArgs = true;
    private argName: null | string = null;

    arg(x: string) {
        if (x[0] === "-" && this.acceptArgs) {
            this.handleOption(x);
        } else {
            this.handleArgument(x);
        }
    }

    private handleOption(x: string) {
        if (x === "--") this.acceptArgs = false;
        else if (x === "-h" || x === "--help") this.displayHelp = true;
        else if (x === "-u" || x === "--unify") this.unify = true;
        else if (x === "-x" || x === "--sparse") this.sparse = true;
        else if (x === "-o") this.argName = x;
        else throw new Error("Unrecognized option " + x);
    }

    private handleArgument(x: string) {
        if (this.argName) {
            if (this.argName === "-o") this.output = x;
            this.argName = null;
        } else {
            this.inputs.push(x);
        }
    }
}
