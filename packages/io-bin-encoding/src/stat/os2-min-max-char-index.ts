import { Os2 } from "@ot-builder/ft-metadata";

import { EmptyStat, EncodingStat } from "./interface";

///////////////////////////////////////////////////////////////////////////////////////////////////

export class Os2MinMaxCharStat extends EmptyStat {
    private min = 0xffff;
    private max = 0;
    constructor(private readonly os2: Os2.Table, external?: EncodingStat) {
        super(external);
    }
    public addEncoding(u: number) {
        super.addEncoding(u);
        if (u < this.min) this.min = u;
        if (u <= 0xffff && u > this.max) this.max = u;
    }
    public settle() {
        super.settle();
        this.os2.usFirstCharIndex = this.min;
        this.os2.usLastCharIndex = this.max;
    }
}
