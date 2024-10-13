import {simpleGit} from 'simple-git';

export async function isFolderInGit(folderPath: string): Promise<boolean> {
  try {
    const git = simpleGit(folderPath);
    return (await git.checkIgnore(folderPath)).length === 0;
  } catch (error) {
    if (
      (error as Error).message.includes(
        'Cannot use simple-git on a directory that does not exist'
      )
    ) {
      return true;
    }
    console.log(`${error}`);
    return false;
  }
}
