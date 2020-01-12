import { Assert } from "@ot-builder/errors";

import { CffStandardStrings } from "./data";

export class CffStringSink {
    private mapping: Map<string, number> = new Map();
    private n: number;

    constructor() {
        this.n = CffStandardStrings.length;
        for (let sid = 0; sid < CffStandardStrings.length; sid++) {
            this.mapping.set(CffStandardStrings[sid], sid);
        }
    }

    public push(s: string) {
        const existing = this.mapping.get(s);
        if (existing !== undefined) return existing;
        const sid = this.n++;
        this.mapping.set(s, sid);
        return sid;
    }
    public getStringIndexList() {
        const strList: string[] = [];
        for (const [s, ix] of this.mapping) {
            if (ix >= CffStandardStrings.length) strList[ix - CffStandardStrings.length] = s;
        }
        Assert.NoGap("string ist", strList);
        return strList;
    }
}
