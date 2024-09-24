import { bold, gray, red } from 'ansis';

export function formatInfo(message: string, token: string) {
  return `${gray('>')} ${gray(bold(token))} ${message}`;
}
export function formatError(message: string, token: string) {
  return `${red('>')} ${red(bold(token))} ${message}`;
}
