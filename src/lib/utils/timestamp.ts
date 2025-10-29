export const BASE_TIMESTAMP = 0; // 01/01/1970 00:00:00 UTC

export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};
