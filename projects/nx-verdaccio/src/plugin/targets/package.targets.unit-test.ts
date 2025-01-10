import { describe, it, expect } from 'vitest';

import {
  getPkgTargets,
  isPkgProject,
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
} from './package.targets';

import { EXECUTOR_PACKAGE_NPM_INSTALL } from '../../executors/pkg-install/constants';
import { EXECUTOR_PACKAGE_NPM_PUBLISH } from '../../executors/pkg-publish/constants';

describe('isPkgProject', () => {
  it('should return true for projects with projectType is library', () => {
    expect(
      isPkgProject(
        {
          root: 'libs/my-lib',
          name: 'my-lib',
          projectType: 'library',
        },
        {}
      )
    ).toBe(true);
  });
  it('should return true for projects with tags present in plugin options.filterByTags', () => {
    expect(
      isPkgProject(
        {
          root: 'libs/my-lib',
          name: 'my-lib',
          projectType: 'library',
          tags: ['publish'],
        },
        {
          filterByTags: ['publish'],
        }
      )
    ).toBe(true);
  });
  it('should return false for projects with no tags present in plugin options.filterByTags', () => {
    expect(
      isPkgProject(
        {
          root: 'libs/my-lib',
          name: 'my-lib',
          projectType: 'library',
          tags: ['type:publish'],
        },
        {
          filterByTags: ['publish'],
        }
      )
    ).toBe(false);
  });

  it('should return false for projects with projectType is not library', () => {
    expect(
      isPkgProject(
        {
          root: 'apps/my-app',
          name: 'my-app',
          projectType: 'application',
        },
        {}
      )
    ).toBe(false);
  });
});

describe('getPkgTargets', (): void => {
  it('should generate PkgTargets with correct structure', (): void => {
    const result = getPkgTargets();
    expect(result).toMatchObject({
      [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
      [TARGET_PACKAGE_INSTALL]: expect.any(Object),
    });
  });

  it('should generate TARGET_PACKAGE_PUBLISH with correct structure', (): void => {
    const result = getPkgTargets();
    expect(result[TARGET_PACKAGE_PUBLISH]).toMatchObject({
      dependsOn: expect.any(Array),
      executor: expect.stringMatching(new RegExp(`.+:${EXECUTOR_PACKAGE_NPM_PUBLISH}`)),
      options: expect.any(Object),
    });
  });

  it('should generate TARGET_PACKAGE_INSTALL with correct structure', (): void => {
    const result = getPkgTargets();
    expect(result[TARGET_PACKAGE_INSTALL]).toMatchObject({
      dependsOn: expect.any(Array),
      executor: expect.stringMatching(new RegExp(`.+:${EXECUTOR_PACKAGE_NPM_INSTALL}`)),
      options: expect.any(Object),
    });
  });
});
