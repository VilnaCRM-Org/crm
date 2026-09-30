import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

export type Files = Record<string, string>;

export type FakeFileSystem = { readFile: jest.Mock; readDir: jest.Mock };

export type TarEntry = { name: string; body?: string; type?: string; prefix?: string };

const TAR_BLOCK_SIZE = 512;

export function sha256(content: string | Uint8Array): string {
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

function tarHeader({ name, body = '', type = '0', prefix = '' }: TarEntry): Buffer {
  const header = Buffer.alloc(TAR_BLOCK_SIZE);
  header.write(name, 0, 100);
  header.write(`${Buffer.byteLength(body).toString(8).padStart(11, '0')}\0`, 124);
  header.write(type, 156);
  header.write('ustar\u000000', 257);
  header.write(prefix, 345);
  return header;
}

function tarBlock(entry: TarEntry): Buffer {
  const body = Buffer.from(entry.body ?? '');
  const padding = (TAR_BLOCK_SIZE - (body.length % TAR_BLOCK_SIZE)) % TAR_BLOCK_SIZE;
  return Buffer.concat([tarHeader(entry), body, Buffer.alloc(padding)]);
}

export function paxRecord(key: string, value: string): string {
  const tail = ` ${key}=${value}\n`;
  let length = tail.length + 1;
  while (`${length}${tail}`.length !== length) {
    length += 1;
  }
  return `${length}${tail}`;
}

export function tarball(entries: TarEntry[]): Buffer {
  const archive = Buffer.concat([...entries.map(tarBlock), Buffer.alloc(TAR_BLOCK_SIZE * 2)]);
  return gzipSync(archive);
}

export function npmTarball(files: Files): Buffer {
  return tarball(Object.entries(files).map(([name, body]) => ({ name: `package/${name}`, body })));
}
