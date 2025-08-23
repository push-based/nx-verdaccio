export type Prettify<T> = {
  [K in keyof T]: T[K];
} & Record<string, unknown>;

export type WithRequired<T, K extends keyof T> = Prettify<
  Required<Pick<T, K>> & Omit<T, K>
>;
