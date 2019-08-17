export interface RunsState<A extends any[]> {
    update(...args: A): void;
}
