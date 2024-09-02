import {type CreateNodes, readJsonFile, TargetConfiguration,} from '@nx/devkit';
import {dirname, join, relative} from 'node:path';
import type {ProjectConfiguration} from 'nx/src/config/workspace-json-project-json';

const tmpNpmEnv = join('tmp', 'npm-env');

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string) => {
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
            ...(isNpmEnv && e2eTargets(projectConfiguration)),
            ...(isNpmEnv && verdaccioTargets(projectConfiguration)),
            ...(isPublishable && npmTargets({...projectConfiguration, root})),
          },
        },
      },
    };
  },
];

function e2eTargets(projectConfiguration: ProjectConfiguration) {
  const {name: projectName} = projectConfiguration;
  return {
    'e2e': {
      dependsOn: [
        {
          projects: 'self',
          target: 'pretarget-setup-env',
          params: 'forward',
        },
      ],
      options: {
        envProjectName: projectName,
      },
    },
  };
}

function verdaccioTargets(projectConfiguration: ProjectConfiguration): Record<string, TargetConfiguration> {
  const {name: projectName} = projectConfiguration;
  return {
    'pretarget-start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(tmpNpmEnv, projectName, 'storage'),
        clear: true,
      },
    },
    'pretarget-setup-npm-env': {
      command: 'tsx --tsconfig=tools/tsconfig.tools.json tools/bin/npm-env.ts',
      options: {
        projectName,
        targetName: 'pretarget-start-verdaccio',
        workspaceRoot: join(tmpNpmEnv, projectName),
        readyWhen: 'Environment ready under',
      },
    },
    'pretarget-teardown-env': {
      command: 'tsx --tsconfig=tools/tsconfig.tools.json tools/bin/teardown-env.ts --workspaceRoot={args.workspaceRoot}',
      options: {
        workspaceRoot: join(tmpNpmEnv, projectName),
      },
    },
    'pretarget-setup-env': {
      cache: true,
      inputs: ["default", "^production", "!{projectRoot}/**/*.md"],
      outputs: [
        `{workspaceRoot}/${tmpNpmEnv}/${projectName}/node_modules`
      ],
      executor: "nx:run-commands",
      options: {
        commands: [
          `nx pretarget-setup-npm-env ${projectName}`,
          `nx pretarget-setup-deps ${projectName} --envProjectName={args.envProjectName}`,
          `nx pretarget-teardown-env ${projectName} --workspaceRoot={args.workspaceRoot}`
        ],
        workspaceRoot: join(tmpNpmEnv, projectName),
        forwardAllArgs: true,
        envProjectName: projectName,
        parallel: false,
      },
    },
    'pretarget-setup-deps': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'pretarget-npm-install',
          params: 'forward',
        }
      ],
      options: {
        envProjectName: projectName,
      },
      command: 'echo Dependencies installed!',
    }
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
    'pretarget-npm-publish': {
      dependsOn: [
        {projects: 'self', target: 'build', params: 'forward'},
        {
          projects: 'dependencies',
          target: 'pretarget-npm-publish',
          params: 'forward',
        },
      ],
      command: `npm publish --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        cwd: outputPath,
        envProjectName: `${projectName}`,
      },
    },
    'pretarget-npm-install': {
      dependsOn: [
        {projects: 'self', target: 'pretarget-npm-publish', params: 'forward'},
        {
          projects: 'dependencies',
          target: 'pretarget-npm-install',
          params: 'forward',
        },
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${tmpNpmEnv}/{args.envProjectName} --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        pkgVersion,
        envProjectName: projectName,
      },
    }
  };
}
