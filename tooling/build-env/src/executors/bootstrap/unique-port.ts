import { getRandomValues } from 'node:crypto';

const uniqueNumbers = new Set();
export function uniquePort() {
  const a = 0;
  const b = 1000;
  const rnd =
    6000 +
    ((a + ((b - a + 1) * getRandomValues(new Uint32Array(1))[0]) / 2 ** 32) |
      0);
  if (uniqueNumbers.has(rnd)) {
    return uniquePort();
  } else {
    uniqueNumbers.add(rnd);
    return rnd;
  }
}
