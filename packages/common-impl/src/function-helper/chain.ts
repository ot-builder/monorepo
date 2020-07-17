export class Chain<X> {
    constructor(private m_x: X) {}
    public get result() {
        return this.m_x;
    }
    public apply<Y>(fn: (x: X) => Y) {
        return new Chain(fn(this.m_x));
    }
}
