import {type CreateNodes, readJsonFile, TargetConfiguration,} from '@nx/devkit';
import {dirname, join, relative} from 'node:path';
import type {ProjectConfiguration} from 'nx/src/config/workspace-json-project-json';

const tmpNpmEnv = join('tmp', 'npm-env');

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts: undefined | unknown) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    const tags = projectConfiguration?.tags ?? [];
    const isPublishable = tags.some((target) => target === 'publishable');
    const isNpmEnv = tags.some((target) => target === 'npm-env');
    if (isNpmEnv) {
      console.info('verdaccioTargets' + projectConfiguration.name);
    }
    isPublishable && console.info('npmTargets' + projectConfiguration.name);
    return {
      projects: {
        [root]: {
          targets: {
            ...(isNpmEnv && verdaccioTargets(projectConfiguration)),
            ...(isPublishable && npmTargets({...projectConfiguration, root})),
          },
        },
      },
    };
  },
];

function verdaccioTargets(projectConfiguration: ProjectConfiguration) {
  const {name: projectName} = projectConfiguration;
  return {
    'graph-start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(tmpNpmEnv, projectName, 'storage'),
        clear: true
      },
    },
    'graph-setup-npm-env': {
      command: 'tsx --tsconfig=tools/tsconfig.tools.json tools/bin/setup-npm-env.ts',
      options: {
        projectName,
        envProjectName: projectName,
        targetName: 'graph-start-verdaccio',
        workspaceRoot: join(tmpNpmEnv, projectName),
        location: 'none',
        readyWhen: 'Environment ready under',
      },
    },
    'graph-install-npm-env': {
      dependsOn: [
        {projects: 'dependencies', target: 'graph-npm-install', params: 'forward'}
      ],
      command: 'echo Dependencies installed!'
    },
  };
}

const relativeFromPath = (dir) =>
  relative(join(process.cwd(), dir), join(process.cwd()));

function npmTargets(
  projectConfiguration: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const {root, name: projectName, targets} = projectConfiguration;
  const {build} = targets;
  const {options} = build;
  const {outputPath} = options;
  if (outputPath == null) {
    throw new Error('outputPath is required');
  }

  const {name: packageName, version: pkgVersion} = readJsonFile(
    join(root, 'package.json')
  );

  return {
    'graph-npm-publish': {
      dependsOn: [
        {projects: 'self', target: 'build', params: 'forward'},
        {projects: 'dependencies', target: 'graph-npm-publish', params: 'forward'}
      ],
      command: `npm publish --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        cwd: outputPath,
        envProjectName: `${projectName}-npm-env`,
      },
    },
    'graph-npm-install': {
      dependsOn: [
        {projects: 'self', target: 'graph-npm-publish', params: 'forward'},
        {projects: 'dependencies', target: 'graph-npm-install', params: 'forward'}
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${tmpNpmEnv}/{args.envProjectName} --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        pkgVersion,
        envProjectName: projectName,
      },
    },
    'graph-npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
