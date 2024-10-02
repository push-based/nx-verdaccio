import {getEnvVars, jsPackagesCoreConfig, lighthouseCoreConfig} from "../../../code-pushup.preset";

// see: https://github.com/code-pushup/cli/blob/main/packages/models/docs/models-reference.md#coreconfig
export default {
  upload: getEnvVars(),
  plugins: [
    await lighthouseCoreConfig('https://nx.dev/'),
  ],
};
