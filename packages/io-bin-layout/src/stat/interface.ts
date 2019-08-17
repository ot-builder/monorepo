export interface OtlStat {
    setContext(c: number): void;
    settle(): void;
}

export class EmptyStat implements OtlStat {
    public setContext() {}
    public settle() {}
}
