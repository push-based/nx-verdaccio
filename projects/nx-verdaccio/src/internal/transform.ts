export function iterateEntries<T, K extends string, V>(
  obj: T,
  cb: (entries: [keyof T, T[keyof T]][]) => [K, V][]
): { [key in K]: V } {
  return Object.fromEntries(
    cb(Object.entries(obj) as [keyof T, T[keyof T]][])
  ) as { [key in K]: V };
}
