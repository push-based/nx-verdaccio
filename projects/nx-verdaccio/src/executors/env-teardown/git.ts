import type {SimpleGit} from "simple-git";
import {simpleGit} from "simple-git";
import {resolve} from "node:path";

export const gitClient: SimpleGit = simpleGit();

export async function cleanGitHistoryForFolder(
  environmentRoot: string,
  options?: { verbose?: boolean },
  git: SimpleGit = gitClient
): Promise<void> {

  await git.show(['--oneline']);

}

export async function isFolderInRepo(
  folderPath: string
): Promise<boolean> {
  try {
    // Initialize simple-git with the folder path
    const git = simpleGit(folderPath);
    // Check if the folder is a git repository
    const isRepo = (await git.checkIgnore(folderPath)).length === 0
    // console.log(`${folderPath} is ${isRepo ? '' : 'not '} in Git repository.`);
    return isRepo;
  } catch (error) {
    if((error as Error).message.includes("Cannot use simple-git on a directory that does not exist")) {
      return true;
    }
    console.log(`${error}`);
    return false;
  }
}

export async function isSubfolderInGitRepository(subFolderPath: string, baseFolderPath = process.cwd()) {
  // Resolve the full path for the subfolder
  const fullSubFolderPath = resolve(baseFolderPath, subFolderPath);

  // Initialize simple-git with the full subfolder path
  const git = simpleGit(fullSubFolderPath);

  try {
    // Check if the subfolder path is within a Git repository
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      console.log(`${fullSubFolderPath} is inside a Git repository.`);
    } else {
      console.log(`${fullSubFolderPath} is not inside a Git repository.`);
    }
    return isRepo;
  } catch (error) {
    console.log(`${fullSubFolderPath} is not inside a Git repository.`);
    return false;
  }
}
