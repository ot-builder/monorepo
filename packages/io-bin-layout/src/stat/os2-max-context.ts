import { Os2 } from "@ot-builder/ot-metadata";

import { OtlStat } from "./interface";

export class Os2Stat implements OtlStat {
    constructor(private os2: Os2.Table) {}

    private usMaxContext = 1;
    public setContext(n: number) {
        if (n > this.usMaxContext) this.usMaxContext = n;
    }
    public settle() {
        this.os2.usMaxContext = this.usMaxContext;
    }
}
