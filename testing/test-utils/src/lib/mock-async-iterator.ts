export class MockAsyncIterableIterator<T> implements AsyncIterableIterator<T> {
  constructor(private value: T) {}

  [Symbol.asyncIterator]() {
    return this;
  }

  next() {
    return Promise.resolve({ value: this.value, done: true });
  }
}
