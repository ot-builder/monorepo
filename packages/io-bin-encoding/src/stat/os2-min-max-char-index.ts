import { Os2 } from "@ot-builder/ot-metadata";

import { EmptyStat, EncodingStat } from "./interface";

///////////////////////////////////////////////////////////////////////////////////////////////////

export class Os2MinMaxCharStat extends EmptyStat {
    private min = 0xffffff;
    private max = 0;
    constructor(
        private readonly os2: Os2.Table,
        external?: EncodingStat
    ) {
        super(external);
    }
    public addEncoding(u: number) {
        super.addEncoding(u);
        if (u < this.min) this.min = u;
        if (u > this.max) this.max = u;
    }
    public settle() {
        super.settle();
        // Set the stats only if we really initialized it
        if (this.min <= this.max) {
            this.os2.usFirstCharIndex = this.min;
            this.os2.usLastCharIndex = Math.min(0xffff, this.max);
        }
    }
}
