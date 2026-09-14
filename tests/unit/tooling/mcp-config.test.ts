/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

type McpServer = { type?: string; url?: string; command?: string; env?: Record<string, string> };

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const servers = (JSON.parse(readRepoFile('.mcp.json')) as { mcpServers: Record<string, McpServer> })
  .mcpServers;

const SECRET_SHAPES = [/token/i, /secret/i, /api[_-]?key/i, /figd_/, /Bearer /];

describe('project MCP servers (.mcp.json, issue #152)', () => {
  it('registers the Figma remote server the design gate runs through', () => {
    expect(servers.figma).toEqual({ type: 'http', url: 'https://mcp.figma.com/mcp' });
  });

  it('keeps the Storybook server on the documented local port', () => {
    expect(servers.storybook).toEqual({ type: 'http', url: 'http://localhost:6006/mcp' });
  });

  it('carries no credential in any server entry', () => {
    const serialized = JSON.stringify(servers);

    SECRET_SHAPES.forEach((shape) => expect(serialized).not.toMatch(shape));
    Object.values(servers).forEach((server) => {
      expect(server.env).toBeUndefined();
      expect(server.command).toBeUndefined();
    });
  });

  it('is what the figma-design-check skill and the agent guide point at', () => {
    const skill = readRepoFile('.claude/skills/figma-design-check/SKILL.md');
    const agents = readRepoFile('AGENTS.md');

    expect(skill).toContain('https://mcp.figma.com/mcp');
    expect(skill).toContain('BLOCKED');
    expect(skill).toContain('xZ7ccrH6d4QyqLQsayFSEX');
    expect(skill).toContain('Offline fallback');
    expect(agents).toContain('https://mcp.figma.com/mcp');
    expect(readRepoFile('.claude/react-sdlc.yml')).toMatch(/^\s+figma: true$/m);
  });
});
