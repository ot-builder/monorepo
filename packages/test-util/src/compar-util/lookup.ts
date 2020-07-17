import { BimapCtx } from "./bimap";
import { CompareContext } from "./context";

export class LookupCtx<A, B> implements CompareContext<LookupCtx<A, B>> {
    private constructor(
        public readonly derived: boolean,
        public readonly glyphs: BimapCtx<A>,
        public readonly lookups: BimapCtx<B>
    ) {}
    public CreateForward() {
        return new LookupCtx(true, this.glyphs.CreateForward(), this.lookups.CreateForward());
    }
    public CreateFlip() {
        return new LookupCtx(true, this.glyphs.CreateFlip(), this.lookups.CreateFlip());
    }

    public static from<A, B>(a: BimapCtx<A>, b: BimapCtx<B>) {
        return new LookupCtx(false, a, b);
    }
}
