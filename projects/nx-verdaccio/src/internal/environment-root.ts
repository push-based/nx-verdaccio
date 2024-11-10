import { join } from 'node:path';
import { type ExecutorContext } from '@nx/devkit';
import { type ExpandedPluginConfiguration } from 'nx/src/config/nx-json';
import { type NxVerdaccioCreateNodeOptions } from '../plugin/schema';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../plugin/constants';
import { type Environment } from '../executors/env-bootstrap/npm';

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
  const { environmentRoot } = options;
  const environmentsDir = getEnvironmentDir(context);
  return environmentRoot ?? join(environmentsDir, context.projectName);
}
