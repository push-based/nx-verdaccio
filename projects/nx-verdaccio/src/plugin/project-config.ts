import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function getPackageJsonNxConfig(
  path: string
): Promise<ProjectConfiguration | null> {
  const pkg = await readJson<Record<string, unknown>>(join(process.cwd(), path));
  const nx = pkg?.nx as ProjectConfiguration | undefined;
  return nx && typeof nx.name === 'string' ? nx : null;
}

export async function getProjectJsonNxConfig(
  path: string
): Promise<ProjectConfiguration | null> {
  const projectJsonPath = path.endsWith('package.json')
    ? join(process.cwd(), dirname(path), 'project.json')
    : join(process.cwd(), path);

  const proj = await readJson<ProjectConfiguration>(projectJsonPath);
  return proj && typeof proj.name === 'string' ? proj : null;
}

export async function getProjectConfig(
  path: string,
  primary: (filePath: string) => Promise<ProjectConfiguration | null>,
  fallback: (filePath: string) => Promise<ProjectConfiguration | null>
): Promise<ProjectConfiguration> {
  return (
    (await primary(path)) ??
    (await fallback(path)) ??
    Promise.reject(
      new Error(`Could not read project configuration from ${path}`)
    )
  );
}
