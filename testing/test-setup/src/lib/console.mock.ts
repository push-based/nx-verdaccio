import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';

let consoleInfoSpy: MockInstance<unknown[], void> | undefined;
let consoleWarnSpy: MockInstance<unknown[], void> | undefined;
let consoleErrorSpy: MockInstance<unknown[], void> | undefined;

beforeEach(() => {
  // In multi-progress-bars, console methods are overriden
  if (console.info != null) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  }

  if (console.warn != null) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  }

  if (console.error != null) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterEach(() => {
  consoleInfoSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
});
