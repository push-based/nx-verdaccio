import {simpleGit} from 'simple-git';

export async function isFolderInGit(folderPath: string): Promise<boolean> {
  try {
    // Initialize simple-git with the folder path
    const git = simpleGit(folderPath);
    // Check if the folder is a git repository
    const isRepo = (await git.checkIgnore(folderPath)).length === 0;
    // console.log(`${folderPath} is ${isRepo ? '' : 'not '} in Git repository.`);
    return isRepo;
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
