export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}
