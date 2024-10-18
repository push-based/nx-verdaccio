import { join } from 'node:path';
import { ExecutorContext } from '@nx/devkit';
import { ExpandedPluginConfiguration } from 'nx/src/config/nx-json';
import { NxVerdaccioCreateNodeOptions } from '../plugin/schema';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../plugin/constants';
import { Environment } from '../executors/env-bootstrap/npm';

export function getEnvironmentDir(context: ExecutorContext) {
  const plugin = context.nxJsonConfiguration?.plugins?.find((pCfg) => {
    return (
      typeof pCfg === 'object' && pCfg?.plugin === '@push-based/nx-verdaccio'
    );
  }) as ExpandedPluginConfiguration<NxVerdaccioCreateNodeOptions>;
  return (
    plugin?.options?.environments?.environmentsDir ??
    DEFAULT_ENVIRONMENTS_OUTPUT_DIR
  );
}

export function getEnvironmentRoot(
  context: ExecutorContext,
  options: Partial<Environment>
) {
  const { environmentRoot: optEnvironmentRoot } = options;
  const environmentsDir = getEnvironmentDir(context);
  return optEnvironmentRoot ?? join(environmentsDir, context.projectName);
}
