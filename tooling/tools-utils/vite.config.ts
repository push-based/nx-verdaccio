import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/projects/tools-utils',

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    setupFiles: [
      'testing/test-setup/src/lib/console.mock.ts',
      'testing/test-setup/src/lib/fs.mock.ts',
      'testing/test-setup/src/lib/reset.mock.ts',
    ],
    coverage: {
      reportsDirectory: '../../coverage/projects/tools-utils',
      provider: 'v8',
    },
  },
});
