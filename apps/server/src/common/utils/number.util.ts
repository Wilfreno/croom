/** The value as a whole number of 1 or more, or `undefined` when it's missing or isn't one. */
export function parsePositiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
