import {describe, expect} from "vitest";
import {normalizeOptions} from "./normalize-options";
import type {ExecutorContext} from "@nx/devkit";

describe('normalizeOptions', () => {
  it('should normalize options', () => {
    expect(normalizeOptions({ projectName: 'test' } as ExecutorContext, {environmentProject: 'test'})).toEqual({
      projectName: 'test',
      options: {
        environmentProject: 'test',
        environmentRoot: 'tmp/environments/test'
      }
    });
  })

  it('should normalize options with given environmentRoot to ', () => {
    expect(normalizeOptions({ projectName: 'test' } as ExecutorContext, {
      environmentProject: 'test',
      environmentRoot: 'static-e2e-environments/dummy-react-app'
    })).toEqual({
      projectName: 'test',
      options: {
        environmentProject: 'test',
        environmentRoot: 'static-e2e-environments/dummy-react-app'
      }
    });
  })
});
