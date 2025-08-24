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
  const pkg = await readJson<Record<string, unknown>>(
    join(process.cwd(), path)
  );
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

export async function getProjectConfigWithNameFallback(
  configPath: string,
  primary: (filePath: string) => Promise<ProjectConfiguration | null>,
  fallback: (filePath: string) => Promise<ProjectConfiguration | null>
): Promise<ProjectConfiguration> {
  const cfg = await getProjectConfig(configPath, primary, fallback).catch(
    () => null
  );

  if (!cfg?.name) {
    // If no name is found and it's a package.json, try to extract name from package.json
    if (configPath.endsWith('package.json')) {
      const pkg = await readJson<Record<string, unknown>>(
        join(process.cwd(), configPath)
      );
      const packageName = pkg?.name;

      if (typeof packageName === 'string' && cfg) {
        return { ...cfg, name: packageName };
      } else if (typeof packageName === 'string') {
        return { name: packageName, root: dirname(configPath) };
      }
    }

    throw new Error(
      `No project name found in configuration at ${configPath}. ` +
        `Please ensure the project has a name defined in project.json or package.json.`
    );
  }

  return cfg;
}
