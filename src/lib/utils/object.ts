export function mergeByKey<K extends PropertyKey, V>(...records: Record<K, V>[]): Record<K, V> {
  return Object.assign({}, ...records);
}
