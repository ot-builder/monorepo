import { CompareContext } from "./context";

export class EmptyCtx implements CompareContext<EmptyCtx> {
    private constructor(readonly derived: boolean = false) {}
    public CreateForward() {
        return new EmptyCtx(true);
    }
    public CreateFlip() {
        return new EmptyCtx(true);
    }

    public static create() {
        return new EmptyCtx();
    }
}
