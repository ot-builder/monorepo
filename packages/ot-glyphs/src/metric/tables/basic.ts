export const TagHmtx = "hmtx";
export const TagVmtx = "vmtx";

export class Measure {
    constructor(
        public advance: number = 0,
        public startSideBearing: number = 0
    ) {}
}
export class Table {
    public measures: Measure[] = [];
}
