import { simpleGit } from 'simple-git';

export async function isFolderInGit(folderPath: string): Promise<boolean> {
  try {
    const git = simpleGit(folderPath);
    // Check if the folder is a git repository
    const isRepo = (await git.checkIgnore(folderPath)).length === 0;
    return isRepo;
  } catch (error) {
    // git checkIgnore throws an error if the folder does not exist.
    // this also means the folder is not checked into git.
    if (
      (error as Error).message.includes(
        'Cannot use simple-git on a directory that does not exist'
      )
    ) {
      return false;
    }
    // @TODO handle better
    console.log(`${error}`);
    return false;
  }
}
