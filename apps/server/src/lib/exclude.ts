export default function exclude<O, Key extends keyof O>(object: O, keys: Key[]): Omit<O, Key> {
  return Object.fromEntries(Object.entries(object!).filter(([key]) => !keys.includes(key as Key))) as Omit<O, Key>;
}
