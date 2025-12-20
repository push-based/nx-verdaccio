import { describe, it, expect } from 'vitest';
import { isPkgProject } from './package.targets';

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
