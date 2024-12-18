import { join } from 'node:path';

export const REPO_NAME = '__nx-ts-repo__';
export const envRoot = `tmp/environments/${process.env['NX_TASK_TARGET_PROJECT']}`;
export const projectName = 'pkg';
export const e2eProjectName = 'pkg-e2e';
