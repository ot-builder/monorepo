import { Input, KeyProvider, NonTerminalBuilder, RuleBuilder, Session } from "./pairing";

export class NonTerminalRule<K> {
    constructor(public readonly symbol: K, public readonly parts: K[]) {}
    public toString() {
        return `${this.symbol} -> ${this.parts.join("")}`;
    }
}
export class RootRule<K> {
    constructor(public readonly parts: K[]) {}
    public toString() {
        return `${this.parts.join("")}`;
    }
}
const TestRuleBuilder: RuleBuilder<string, NonTerminalRule<string>, RootRule<string>> = {
    createNonTerminalRule(symbol: string, parts: string[]) {
        return new NonTerminalRule(symbol, parts);
    },
    createInputRule(parts: string[]) {
        return new RootRule(parts);
    }
};
const StringKeyProvider: KeyProvider<string> = {
    getIrKey: s => s,
    isBarrier: s => s === " "
};
class StringNtSrc implements NonTerminalBuilder<string> {
    private n = 0;
    public createNonTerminal() {
        return `${String.fromCodePoint("A".codePointAt(0)! + this.n++)}`;
    }
}

describe("Re-pair pair management", () => {
    test("Pair insert", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "ababcdcdefef");
        session.collectBuckets();
        const ab = session.getEntry(2)!;
        expect(ab.firstOccurrence!.nextSameDigraph !== ab.firstOccurrence);
    });
    test("Pair build-up: overlapping", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "aaaaa");
        session.collectBuckets();
        expect(session.getEntry(1)).toBeFalsy();
        expect(session.getEntry(2)).toBeTruthy();
        expect(session.getEntry(3)).toBeFalsy();
    });
    test("Replacement test", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "aaaaaaaa");
        session.collectBuckets();
        session.doSubstitute(session.getEntry(4)!, "B");
        expect(session.stringOf(input)).toBe("BBBB");
        expect(session.getEntry(4)).toBeFalsy();
        expect(session.getEntry(3)).toBeFalsy();
        session.doSubstitute(session.getEntry(2)!, "C");
        expect(session.stringOf(input)).toBe("CC");
    });
    test("Replacement barrier test", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "aa a a aa aa");
        session.collectBuckets();
        expect(session.getEntry(3)).toBeTruthy();
        session.doSubstitute(session.getEntry(3)!, "A");
        expect(session.stringOf(input)).toBe("A a a A A");
    });
    test("Combined compression test 1", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "aaabcaabaaabcabdabd");
        const rules = [...session.doCompress(new StringNtSrc(), TestRuleBuilder)];
        expect(session.inputToRule(input, TestRuleBuilder).toString()).toBe("EBECC");
        expect(rules.map(x => x.toString())).toEqual([
            `A -> ab`,
            `B -> aA`,
            `C -> Ad`,
            `D -> aB`,
            `E -> Dc`
        ]);
    });
    test("Combined compression test 2", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(input, "singing.do.wah.diddy.diddy.dum.diddy.do");
        const rules = [...session.doCompress(new StringNtSrc(), TestRuleBuilder)];
        expect(session.inputToRule(input, TestRuleBuilder).toString()).toBe("sHHG.wahEEAumEG");
        expect(rules.map(x => x.toString())).toEqual([
            "A -> .d",
            "B -> id",
            "C -> dy",
            "D -> AB",
            "E -> DC",
            "F -> in",
            "G -> Ao",
            "H -> Fg"
        ]);
    });
    test("Combined compression test 3", () => {
        const session = new Session<string>(StringKeyProvider);
        const input = new Input<string>("");
        session.appendString(
            input,
            "abcabccabcabcbcabccabacabbbcabccababcabccabcabcbcabccabacabcaba"
        );
        const rules = [...session.doCompress(new StringNtSrc(), TestRuleBuilder)];
        expect(session.inputToRule(input, TestRuleBuilder).toString()).toBe("JbEJBa");
        expect(rules.map(x => x.toString())).toEqual([
            "A -> ab",
            "B -> cA",
            "C -> Bc",
            "D -> CB",
            "E -> bD",
            "F -> aB",
            "G -> AD",
            "H -> CE",
            "I -> GH",
            "J -> IF"
        ]);
    });
});
