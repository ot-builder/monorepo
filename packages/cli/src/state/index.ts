import { Ot } from "ot-builder";

export class CliState {
    private stack: CliStackEntry[] = [];
    push(c: CliStackEntry) {
        this.stack.push(c);
    }
    pop() {
        return this.stack.pop();
    }
}

export class CliStackEntryPlaceholder {
    constructor(public readonly identifier: string) {}
    toString() {
        return `[${this.identifier}]`;
    }
    fill(font: Ot.Font) {
        return new CliStackEntry(this.identifier, font);
    }
}
export class CliStackEntry extends CliStackEntryPlaceholder {
    constructor(identifier: string, public readonly font: Ot.Font) {
        super(identifier);
    }
}
