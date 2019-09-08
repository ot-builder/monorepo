import { Errors } from "@ot-builder/errors";
import { Maybe } from "@ot-builder/prelude/lib/data";
import { TestVariance } from "@ot-builder/test-util";
import { ReadTimeIVD, ReadTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { CffInterp } from "./ir";
import { CffOperator } from "./operator";
import { CffStackMachine } from "./stack-machine";

class MockInterpreter extends CffInterp.Interpreter {
    private st: CffStackMachine;
    constructor(ivs?: Maybe<ReadTimeIVS>) {
        super();
        this.st = new CffStackMachine(ivs);
    }
    public getStack() {
        return this.st.stack;
    }
    public doOperand(x: number) {
        this.st.push(x);
    }
    protected doOperator(opCode: number, flags?: number[]) {
        if (opCode === CffOperator.VsIndex) return this.st.doVsIndex();
        if (opCode === CffOperator.Blend) return this.st.doBlend();
        throw Errors.Cff.OperatorNotSupported(opCode);
    }
}

const Axes = TestVariance.createWellKnownAxes();
const Bold = new OtVar.Master([{ axis: Axes.wght, min: 0, peak: 1, max: 1 }]);
const Wide = new OtVar.Master([{ axis: Axes.wdth, min: 0, peak: 1, max: 1 }]);

function createVS() {
    const ivs = ReadTimeIVS.Create();
    ivs.knownMasters = [Bold, Wide];
    const boldOnly = new ReadTimeIVD<OtVar.Axis, OtVar.Master, OtVar.Value>(
        OtVar.Ops,
        new OtVar.MasterSet()
    );
    boldOnly.masterIDs = [0];
    const wideOnly = new ReadTimeIVD<OtVar.Axis, OtVar.Master, OtVar.Value>(
        OtVar.Ops,
        new OtVar.MasterSet()
    );
    wideOnly.masterIDs = [1];
    const boldAndWide = new ReadTimeIVD<OtVar.Axis, OtVar.Master, OtVar.Value>(
        OtVar.Ops,
        new OtVar.MasterSet()
    );
    boldAndWide.masterIDs = [0, 1];
    ivs.itemVariationData = [boldOnly, wideOnly, boldAndWide];
    return ivs;
}

describe("CFF Interpreter", () => {
    test("Should throw for non-blend when blend called", () => {
        const inter = new MockInterpreter();
        expect(() => inter.operator(CffOperator.Blend)).toThrow();
        expect(() => inter.operator(CffOperator.VsIndex)).toThrow();
    });

    test("Should handle blend", () => {
        const cr = OtVar.Ops.Creator();
        const ivs = createVS();
        const inter = new MockInterpreter(ivs);
        inter.operand(1, 2, 1).operator(CffOperator.Blend);

        expect(1).toBe(inter.getStack().length);
        const [x] = inter.getStack();
        expect(true).toBe(OtVar.Ops.equal(x, cr.make(1, [Bold, 2])));
    });

    test("Should handle blend of multiple arguments", () => {
        const cr = OtVar.Ops.Creator();
        const ivs = createVS();
        const inter = new MockInterpreter(ivs);
        inter.operand(1, 2, 3, 4, 2).operator(CffOperator.Blend);

        expect(2).toBe(inter.getStack().length);
        const [x, y] = inter.getStack();
        expect(true).toBe(OtVar.Ops.equal(x, cr.make(1, [Bold, 3])));
        expect(true).toBe(OtVar.Ops.equal(y, cr.make(2, [Bold, 4])));
    });

    test("Should handle VSIndex", () => {
        const cr = OtVar.Ops.Creator();
        const ivs = createVS();
        const inter = new MockInterpreter(ivs);
        inter.operand(2).operator(CffOperator.VsIndex);
        inter.operand(1, 2, 3, 4, 5, 6, 2).operator(CffOperator.Blend);

        expect(2).toBe(inter.getStack().length);
        const [x, y] = inter.getStack();
        expect(true).toBe(OtVar.Ops.equal(x, cr.make(1, [Bold, 3], [Wide, 4])));
        expect(true).toBe(OtVar.Ops.equal(y, cr.make(2, [Bold, 5], [Wide, 6])));
    });

    test("Should handle blend chaining", () => {
        const cr = OtVar.Ops.Creator();
        const ivs = createVS();
        const inter = new MockInterpreter(ivs);
        inter.operand(2).operator(CffOperator.VsIndex);
        inter.operand(1, 2, 3, 4, 5, 6, 2).operator(CffOperator.Blend);
        inter.operand(3, 4, 5, 6, 2).operator(CffOperator.Blend);

        expect(2).toBe(inter.getStack().length);
        const [x, y] = inter.getStack();
        expect(true).toBe(OtVar.Ops.equal(x, cr.make(1, [Bold, 6], [Wide, 8])));
        expect(true).toBe(OtVar.Ops.equal(y, cr.make(2, [Bold, 10], [Wide, 12])));
    });
});
