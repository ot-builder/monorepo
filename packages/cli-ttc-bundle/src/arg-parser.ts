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
            if (x === "--") this.acceptArgs = false;
            else if (x === "-h" || x === "--help") this.displayHelp = true;
            else if (x === "-u" || x === "--unify") this.unify = true;
            else if (x === "-x" || x === "--sparse") this.sparse = true;
            else if (x === "-o") this.argName = x;
            else throw new Error("Unrecognized option " + x);
        } else {
            if (this.argName === "-o") this.output = x;
            else this.inputs.push(x);
        }
    }
}
