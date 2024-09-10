# test-setup

This library contains test setup.

## Mock setup

In this library you can find all files that can be used in `setupFiles` property of `vitest.config.(unit|integration|e2e).ts` files. Currently include:

- [console](./src/lib/console.mock.ts) mocking
- [file system](./src/lib/fs.mock.ts) mocking
- [reset](./src/lib/reset.mock.ts) mocking

Additionally, you may find helper functions for:

- setting up and tearing down a [testing folder](./src/lib/test-folder.setup.ts)
- [resetting](./src/lib/reset.mocks.ts) mocks
