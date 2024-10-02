import 'dotenv/config';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx, getEnvVars,
  jsPackagesCoreConfig,
  lighthouseCoreConfig
} from './code-pushup.preset';

import {mergeConfigs} from '@code-pushup/utils';
import type {CoreConfig} from '@code-pushup/models';
import jsPackagesPlugin from "@code-pushup/js-packages-plugin";

const config: CoreConfig = {
  plugins: [
    await jsPackagesPlugin()
  ]
};


/*
 upload: getEnvVars(),

export default mergeConfigs(
  config,
  await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig('https://nx.dev/'),
  await eslintCoreConfigNx(),
);
*/
