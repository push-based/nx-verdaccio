import { join } from 'node:path';

export const REPO_NAME = 'nx-ts-repo';
export const envRoot = `tmp/environments/${process.env['NX_TASK_TARGET_PROJECT']}`;
export const workspaceRoot = join(envRoot, '__test__', REPO_NAME);
export const projectName = 'pkg';
export const e2eProjectName = 'pkg-e2e';
