import type { CoreConfig } from '@code-pushup/models';
import jsPackages,  { } from '@code-pushup/js-packages-plugin';

export default {
  plugins: [
    await jsPackages()
  ],
} satisfies CoreConfig;
