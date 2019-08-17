export class DisjointSet<T> {
    private parentMap = new Map<T, T>();
    public has(p: T) {
        const parent = this.parentMap.get(p);
        return parent && parent !== p;
    }
    public find(p: T): T {
        const parent = this.parentMap.get(p);
        if (!parent || p === parent) {
            return p;
        } else {
            const a = this.find(parent);
            this.parentMap.set(p, a);
            return a;
        }
    }
    public merge(a: T, b: T) {
        this.parentMap.set(a, b);
    }
    public remove(p: T) {
        this.parentMap.delete(p);
    }
}
