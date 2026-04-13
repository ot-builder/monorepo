import { type CliArgSource, OptimizationLevel } from "@ot-builder/cli-shared";
import type { Ot } from "ot-builder";

export class CliState implements CliArgSource {
    // Options
    public optimizationLevel = OptimizationLevel.None;
    public recalcOs2XAvgCharWidth = true;
    // Argument stack
    private stack: CliStackEntry[] = [];
    public push(c: CliStackEntry) {
        this.stack.push(c);
    }
    public pop() {
        return this.stack.pop();
    }
    public shift() {
        return this.stack.shift();
    }
    public popAll() {
        const s = this.stack;
        this.stack = [];
        return s;
    }
}

export class CliStackEntryPlaceholder {
    public constructor(public readonly identifier: string) {}
    public toString() {
        return `[${this.identifier}]`;
    }
    public fill(font: Ot.Font) {
        return new CliStackEntry(this.identifier, font);
    }
}
export class CliStackEntry extends CliStackEntryPlaceholder {
    public constructor(
        identifier: string,
        public readonly font: Ot.Font
    ) {
        super(identifier);
    }
}
