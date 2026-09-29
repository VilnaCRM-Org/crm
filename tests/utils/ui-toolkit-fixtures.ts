import { createHash } from 'node:crypto';

export type Files = Record<string, string>;

export type FakeFileSystem = { readFile: jest.Mock; readDir: jest.Mock };

export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function releaseUrl(tag: string, asset = tag): string {
  return (
    'https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/' +
    `v${tag}/vilnacrm-ui-toolkit-${asset}.tgz`
  );
}

function entryKind(files: Files, links: string[], childPath: string): string {
  if (links.includes(childPath)) {
    return 'link';
  }
  return childPath in files ? 'file' : 'directory';
}

export function fileSystem(files: Files, links: string[] = []): FakeFileSystem {
  const readFile = jest.fn((filePath: string, encoding?: BufferEncoding) => {
    const content = files[filePath];
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return encoding === undefined ? Buffer.from(content) : content;
  });
  const readDir = jest.fn((dirPath: string) => {
    const prefix = `${dirPath}/`;
    const names = [...Object.keys(files), ...links]
      .filter((entryPath) => entryPath.startsWith(prefix))
      .map((entryPath) => entryPath.slice(prefix.length).split('/')[0] ?? '');
    return [...new Set(names)].map((name) => {
      const kind = entryKind(files, links, `${prefix}${name}`);
      return {
        name,
        isFile: (): boolean => kind === 'file',
        isDirectory: (): boolean => kind === 'directory',
      };
    });
  });
  return { readFile, readDir };
}
