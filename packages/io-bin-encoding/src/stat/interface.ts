export interface EncodingStat {
    addEncoding(enc: number): void;
    settle(): void;
}

export class EmptyStat implements EncodingStat {
    constructor(private external?: EncodingStat) {}
    public addEncoding(enc: number) {
        if (this.external) this.external.addEncoding(enc);
    }
    public settle() {
        if (this.external) this.external.settle();
    }
}
