export const BASE_TIMESTAMP = 1735700400; // 01/01/25 00:00:00 UTC

export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};
