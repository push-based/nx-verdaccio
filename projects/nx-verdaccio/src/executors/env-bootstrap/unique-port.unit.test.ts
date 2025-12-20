import { uniquePort } from './unique-port';

describe('uniquePort', () => {
  it('should return a different number on every call', () => {
    const portsArray = new Array(10).fill(0).map(() => uniquePort());
    expect(portsArray.length).toBe(new Set(portsArray).size);
  });

  it('should return random number bigger then 6000', () => {
    expect(uniquePort()).toBeGreaterThan(6000);
  });
});
