/**
 * Type that recursively converts all BigInt types to string types
 */
export type BigIntToString<T> = T extends bigint
  ? string
  : T extends Array<infer U>
    ? Array<BigIntToString<U>>
    : T extends object
      ? { [K in keyof T]: BigIntToString<T[K]> }
      : T;

/**
 * Recursively converts all BigInt values in an object, array, or value to strings.
 *
 * @param obj - The input object, array, or value to be converted.
 * @returns The converted object, array, or value with BigInt values as strings.
 *
 * @remarks
 * - If the input is a BigInt, it will be converted to a string.
 * - If the input is an array, the function will be applied to each element.
 * - If the input is an object, the function will be applied to each value.
 * - If the input is neither a BigInt, array, nor object, it will be returned as is.
 */
export const convertBigIntToString = <T>(obj: T): BigIntToString<T> => {
  if (typeof obj === 'bigint') {
    return obj.toString() as BigIntToString<T>;
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString) as BigIntToString<T>;
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)]),
    ) as BigIntToString<T>;
  } else {
    return obj as BigIntToString<T>;
  }
};
