export function inPlaceShuffleArray<T>(array: T[]) {
    let tailIndex = array.length,
        temp: T,
        randIndex: number;

    while (tailIndex) {
        randIndex = Math.floor(Math.random() * tailIndex--);
        temp = array[tailIndex];
        array[tailIndex] = array[randIndex];
        array[randIndex] = temp;
    }
    return array;
}

export function shuffleArray<T>(arr: ReadonlyArray<T>) {
    return inPlaceShuffleArray([...arr]);
}
export function shuffleSet<T>(arr: ReadonlySet<T>) {
    return new Set(inPlaceShuffleArray([...arr]));
}
export function shuffleMap<K, V>(m: ReadonlyMap<K, V>) {
    return new Map(inPlaceShuffleArray([...m]));
}
