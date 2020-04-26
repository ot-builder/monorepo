import { Data } from "@ot-builder/prelude";

// The basic idea: find the most frequent digraph and replace it with a non-terminal
// Reference: Larsson, N. J.; Moffat, A. Offline Dictionary-Based Compression.
//     In Proc. Data Compression Conference ’99(DCC’99). IEEE Computer Society, 1999, p. 296.

export class Rune<K> {
    constructor(public readonly ir: K, public barrier: boolean = false) {}

    // A double-linked list node
    public prev: Rune<K> = this;
    public next: Rune<K> = this;

    // Another double-linked cycle to find out all the digraphs with same pattern
    public digraph: null | Digraph<K> = null;
    public prevSameDigraph: null | Rune<K> = null;
    public nextSameDigraph: null | Rune<K> = null;
}

export interface KeyProvider<K> {
    getIrKey(k: K): string;
    isBarrier(k: K): boolean;
}
export interface RuleBuilder<K, RN, RI> {
    createNonTerminalRule(symbol: K, parts: K[]): RN;
    createInputRule(parts: K[]): RI;
}
export interface NonTerminalBuilder<K> {
    createNonTerminal(a: K, b: K): K;
}

export class Input<K> {
    constructor(nop: K) {
        this.sentinel = new Rune(nop);
        this.sentinel.barrier = true;
    }
    public sentinel: Rune<K>;

    private makeLink(a: Rune<K>, b: Rune<K>) {
        a.next = b;
        b.prev = a;
    }
    public append(rune: Rune<K>) {
        const last = this.sentinel.prev;
        last.next = rune;
        this.sentinel.prev = rune;
        rune.prev = last;
        rune.next = this.sentinel;
    }
    public remove(rune: Rune<K>) {
        const prev = rune.prev;
        const next = rune.next;
        this.makeLink(prev, next);
        this.makeLink(rune, rune);
    }
}

class DigraphSentinel {
    public next: DigraphSentinel = this;
    public prev: DigraphSentinel = this;
}

class Digraph<K> extends DigraphSentinel {
    public count: number = 0; // count == 0 means sentinel
    constructor(public readonly key: string, public firstOccurrence: Rune<K>) {
        super();
    }
    public next: DigraphSentinel = this;
    public prev: DigraphSentinel = this;

    public static getKey<K>(kp: KeyProvider<K>, a: Rune<K>, b: Rune<K>) {
        return `${kp.getIrKey(a.ir)}/${kp.getIrKey(b.ir)}`;
    }
    public removeFromBucket() {
        const prev = this.prev;
        const next = this.next;
        this.prev.next = next;
        this.next.prev = prev;
        this.next = this.prev = this;
    }
    public insertToBucket(head: DigraphSentinel) {
        const bucketLast = head.prev;
        head.prev = this;
        bucketLast.next = this;
        this.prev = bucketLast;
        this.next = head;
    }
}
export class Session<K> {
    constructor(private keyProvider: KeyProvider<K>) {}

    public buckets: (null | DigraphSentinel | Digraph<K>)[] = [];
    public digraphMap: Map<string, Digraph<K>> = new Map();

    public append(input: Input<K>, char: K) {
        this.appendRuneToInput(input, new Rune(char, this.keyProvider.isBarrier(char)));
    }
    public appendString(input: Input<K>, str: Iterable<K>) {
        for (const char of str) {
            this.appendRuneToInput(input, new Rune(char, this.keyProvider.isBarrier(char)));
        }
    }
    private appendRuneToInput(input: Input<K>, rune: Rune<K>) {
        input.append(rune);
        this.addDigraph(rune.prev, rune);
    }
    protected addDigraph(rFirst: Rune<K>, rSecond: Rune<K>) {
        if (rSecond.barrier || rFirst.barrier) return null;
        const digKey = Digraph.getKey(this.keyProvider, rSecond.prev, rSecond);
        const dig = this.digraphMap.get(digKey);
        if (!dig || !dig.count) {
            // Create a new digraph link
            const dig = new Digraph(digKey, rFirst);
            dig.count = 1;
            rFirst.prevSameDigraph = rFirst;
            rFirst.nextSameDigraph = rFirst;
            rFirst.digraph = dig;
            this.digraphMap.set(digKey, dig);
            return dig;
        } else {
            if (rFirst.prev.digraph === dig) return null; // Don't overlap
            const digLastOcc = dig.firstOccurrence.prevSameDigraph!;
            rFirst.digraph = dig;
            dig.count++;
            digLastOcc.nextSameDigraph = rFirst;
            dig.firstOccurrence.prevSameDigraph = rFirst;
            rFirst.prevSameDigraph = digLastOcc;
            rFirst.nextSameDigraph = dig.firstOccurrence;
            return null;
        }
    }
    public removeDigraphLink(rune: Rune<K>) {
        const dig = rune.digraph!;
        if (rune.prevSameDigraph) {
            rune.prevSameDigraph.nextSameDigraph = rune.nextSameDigraph;
            if (dig.firstOccurrence === rune) dig.firstOccurrence = rune.prevSameDigraph;
        }
        if (rune.nextSameDigraph) {
            rune.nextSameDigraph.prevSameDigraph = rune.prevSameDigraph;
            if (dig.firstOccurrence === rune) dig.firstOccurrence = rune.nextSameDigraph;
        }
        rune.digraph = rune.prevSameDigraph = rune.nextSameDigraph = null;
    }
    private updateDigBucket(dig: Data.Maybe<Digraph<K>>) {
        if (!dig) return;
        dig.removeFromBucket();
        if (!dig.count) {
            this.digraphMap.delete(dig.key);
            return;
        }
        const existing = this.buckets[dig.count];
        if (existing) {
            dig.insertToBucket(existing);
        } else {
            const sen = new DigraphSentinel();
            dig.insertToBucket(sen);
            this.buckets[dig.count] = sen;
        }
    }
    public collectBuckets() {
        for (const dig of this.digraphMap.values()) {
            this.updateDigBucket(dig);
        }
    }
    public getEntry(count: number): null | Digraph<K> {
        const sen = this.buckets[count];
        if (!sen) return null;
        const item = sen.next;
        if (item instanceof Digraph) return item;
        else return null;
    }

    public stringOf(input: Input<K>) {
        let s: string = "";
        let node = input.sentinel.next;
        while (node !== input.sentinel) {
            s += this.keyProvider.getIrKey(node.ir);
            node = node.next;
        }
        return s;
    }

    public doSubstitute(dig: Digraph<K>, nonTerminal: K) {
        if (!dig.count || !dig.firstOccurrence) return;
        const affectedDigraphs = new Set<null | Digraph<K>>();
        dig.removeFromBucket();
        dig.count = 0;
        let occ = dig.firstOccurrence;
        do {
            const nextDigOcc = occ.nextSameDigraph!;
            const prev = occ.prev;
            const next = occ.next;
            const nextNext = occ.next.next;
            if (prev.digraph) {
                prev.digraph.count--;
                affectedDigraphs.add(prev.digraph);
                this.removeDigraphLink(prev);
            }
            if (next.digraph) {
                next.digraph.count--;
                affectedDigraphs.add(next.digraph);
                this.removeDigraphLink(next);
            }
            // Insert the non-terminal
            const runeNT = new Rune(nonTerminal);
            prev.next = runeNT;
            nextNext.prev = runeNT;
            runeNT.prev = prev;
            runeNT.next = nextNext;
            // Build up adjacent digraphs
            affectedDigraphs.add(this.addDigraph(prev, runeNT));
            affectedDigraphs.add(this.addDigraph(runeNT, nextNext));
            occ = nextDigOcc!;
        } while (occ && occ !== dig.firstOccurrence);
        for (const d of affectedDigraphs) {
            this.updateDigBucket(d);
        }
    }

    public *doCompress<RN, RI>(ntSrc: NonTerminalBuilder<K>, rb?: RuleBuilder<K, RN, RI>) {
        this.collectBuckets();
        let count = this.buckets.length - 1;
        while (count > 1) {
            const dig = this.getEntry(count);
            if (!dig) {
                count--;
                continue;
            }
            const irFirst = dig.firstOccurrence.ir;
            const irSecond = dig.firstOccurrence.next.ir;
            const nonTerminal = ntSrc.createNonTerminal(irFirst, irSecond);
            this.doSubstitute(dig, nonTerminal);
            if (rb) yield rb.createNonTerminalRule(nonTerminal, [irFirst, irSecond]);
        }
    }

    public inputToRule<RN, RI>(input: Input<K>, rb: RuleBuilder<K, RN, RI>) {
        const parts: K[] = [];
        let sen = input.sentinel.next;
        while (sen && sen !== input.sentinel) {
            parts.push(sen.ir);
            sen = sen.next;
        }
        return rb.createInputRule(parts);
    }
}
