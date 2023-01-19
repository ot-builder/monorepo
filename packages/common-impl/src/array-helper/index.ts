export function inPlaceShrinkArray<T>(set: ReadonlySet<T>, a: T[]) {
    let front = 0;
    for (let rear = 0; rear < a.length; rear++) {
        if (set.has(a[rear])) {
            a[front++] = a[rear];
        }
    }
    a.length = front;
}
