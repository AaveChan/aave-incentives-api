export type NonEmptyArray<T> = [T, ...T[]];

export function toNonEmpty<T>(arr: T[]): NonEmptyArray<T> {
  if (arr.length === 0) {
    throw new Error('Expected non-empty array');
  }
  return arr as NonEmptyArray<T>;
}
