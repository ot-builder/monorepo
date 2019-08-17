export function Uninhabited(): never {
    throw new Error("Uninhabited");
}
export function Unreachable(): never {
    throw new Error("Unreachable");
}
