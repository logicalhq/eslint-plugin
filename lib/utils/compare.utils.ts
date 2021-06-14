export function compareString(x: string, y: string): number {
  const result = new Intl.Collator('en', {
    sensitivity: 'base',
    numeric: true
  }).compare(x, y);

  if (result !== 0) return result;
  return x === y ? 0 : x < y ? -1 : 1;
}
