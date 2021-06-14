// https://github.com/tc39/proposal-array-find-from-last
export function findLastIndex<T>(
  array: Array<T>,
  callbackFn: (element: T, idx: number, array: Array<T>) => boolean
): number {
  for (let idx = array.length - 1; idx >= 0; idx--) {
    if (callbackFn(array[idx], idx, array)) return idx;
  }
  return -1;
}
