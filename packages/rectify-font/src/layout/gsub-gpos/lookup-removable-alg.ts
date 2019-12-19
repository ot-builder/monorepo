import * as Ot from "@ot-builder/font";
import { Thunk } from "@ot-builder/prelude";

export class CLookupRemovableAlg
    implements Ot.Gsub.LookupAlg<boolean>, Ot.Gpos.LookupAlg<boolean> {
    public gsubSingle(thProps: Thunk<Ot.Gsub.SingleProp>): boolean {
        const props = thProps.force();
        return !props.mapping.size;
    }
    public gsubMulti(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): boolean {
        const props = thProps.force();
        return !props.mapping.size;
    }
    public gsubAlternate(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): boolean {
        const props = thProps.force();
        return !props.mapping.size;
    }
    public gsubLigature(thProps: Thunk<Ot.Gsub.LigatureProp>): boolean {
        const props = thProps.force();
        return !props.mapping.length;
    }
    public gsubReverse(thProps: Thunk<Ot.Gsub.ReverseSubProp>): boolean {
        const props = thProps.force();
        return !props.rules.length;
    }
    public gposSingle(thProps: Thunk<Ot.Gpos.SingleProp>): boolean {
        const props = thProps.force();
        return !props.adjustments.size;
    }
    public gposPair(thProps: Thunk<Ot.Gpos.PairProp>): boolean {
        const props = thProps.force();
        const cdFirst = props.adjustments.getXClassDef();
        const cdSecond = props.adjustments.getYClassDef();
        for (let c1 = 0; c1 < cdFirst.length; c1++) {
            for (let c2 = 0; c2 < cdSecond.length; c2++) {
                const cFirst = cdFirst[c1];
                const cSecond = cdSecond[c2];
                const adj = props.adjustments.getByClass(c1, c2);
                if (cFirst.length || cSecond.length || adj != null) return false;
            }
        }
        return true;
    }
    public gposCursive(thProps: Thunk<Ot.Gpos.CursiveProp>): boolean {
        const props = thProps.force();
        return !props.attachments.size;
    }
    public gposMarkToBase(thProps: Thunk<Ot.Gpos.MarkToBaseProp>): boolean {
        const props = thProps.force();
        return !props.marks.size || !props.bases.size;
    }
    public gposMarkToMark(thProps: Thunk<Ot.Gpos.MarkToMarkProp>): boolean {
        const props = thProps.force();
        return !props.marks.size || !props.baseMarks.size;
    }
    public gposMarkToLigature(thProps: Thunk<Ot.Gpos.MarkToLigatureProp>): boolean {
        const props = thProps.force();
        return !props.marks.size || !props.bases.size;
    }
    public gsubChaining(thProps: Thunk<Ot.GsubGpos.ChainingProp<boolean>>): boolean {
        const props = thProps.force();
        return !props.rules.length;
    }
    public gposChaining(thProps: Thunk<Ot.GsubGpos.ChainingProp<boolean>>): boolean {
        const props = thProps.force();
        return !props.rules.length;
    }
}

export const LookupRemovableAlg = new CLookupRemovableAlg();
