import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const { ALGORITHM, UNHASHED_FILES } = UI_TOOLKIT_POLICY;

const BLOCK_SIZE = 512;
const PACKAGE_PREFIX = 'package/';
const REGULAR_FILE_TYPES = Object.freeze(['0', '\0']);
const PAX_HEADER_TYPE = 'x';
const PAX_PATH_RECORD = /^\d+ path=/;
const OCTAL_SIZE = /^[0-7]+$/;

export default class UiToolkitTarballParser {
  packageDigests(gzipped) {
    const digests = new Map();
    for (const { path, bytes } of this.files(gzipped)) {
      digests.set(path, createHash(ALGORITHM).update(bytes).digest('hex'));
    }
    return [...digests.keys()]
      .filter((path) => path.startsWith(PACKAGE_PREFIX))
      .map((path) => ({ path: path.slice(PACKAGE_PREFIX.length), sha256: digests.get(path) }))
      .filter(({ path }) => !UNHASHED_FILES.includes(path))
      .sort((left, right) => (left.path < right.path ? -1 : 1));
  }

  files(gzipped) {
    const archive = gunzipSync(gzipped);
    const cursor = { offset: 0, pathOverride: null, files: [] };
    while (this.hasEntry(archive, cursor.offset)) {
      this.readEntry(archive, cursor);
    }
    return cursor.files;
  }

  hasEntry(archive, offset) {
    const header = archive.subarray(offset, offset + BLOCK_SIZE);
    return header.length === BLOCK_SIZE && header.some((byte) => byte !== 0);
  }

  readEntry(archive, cursor) {
    const header = archive.subarray(cursor.offset, cursor.offset + BLOCK_SIZE);
    const size = this.size(header);
    const start = cursor.offset + BLOCK_SIZE;
    const body = archive.subarray(start, start + size);
    if (body.length !== size) {
      throw new Error(`the tar entry at byte ${cursor.offset} is truncated`);
    }
    this.record(header, body, cursor);
    cursor.offset = start + Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE;
  }

  record(header, body, cursor) {
    const type = String.fromCharCode(header[156]);
    if (type === PAX_HEADER_TYPE) {
      cursor.pathOverride = this.paxPath(body);
      return;
    }
    if (REGULAR_FILE_TYPES.includes(type)) {
      cursor.files.push({ path: cursor.pathOverride ?? this.headerPath(header), bytes: body });
    }
    cursor.pathOverride = null;
  }

  paxPath(body) {
    const record = body
      .toString('utf8')
      .split('\n')
      .find((line) => PAX_PATH_RECORD.test(line));
    return record === undefined ? null : record.slice(record.indexOf('=') + 1);
  }

  headerPath(header) {
    const name = this.text(header, 0, 100);
    const prefix = this.text(header, 345, 155);
    return prefix === '' ? name : `${prefix}/${name}`;
  }

  size(header) {
    const digits = this.text(header, 124, 12).trim();
    if (!OCTAL_SIZE.test(digits)) {
      throw new Error(`the tar header at "${this.headerPath(header)}" has no octal size`);
    }
    return Number.parseInt(digits, 8);
  }

  text(header, start, length) {
    const field = header.subarray(start, start + length);
    const end = field.indexOf(0);
    return field.subarray(0, end === -1 ? length : end).toString('utf8');
  }
}
