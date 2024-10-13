import {describe, expect, it, vi} from 'vitest';
import {cleanGitHistoryForFolder} from './git';
import {execSync} from 'node:child_process';

describe('cleanGitHistoryForFolder', () => {

  it('should clean up given folder', () => {
    cleanGitHistoryForFolder('tmp');
  });

});
