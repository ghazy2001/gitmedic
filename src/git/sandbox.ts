import { simpleGit, SimpleGit } from 'simple-git';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export class GitSandbox {
  public workspaceDir: string;
  private git: SimpleGit;

  constructor(workspaceDir: string) {
    this.workspaceDir = workspaceDir;
    this.git = simpleGit(workspaceDir);
  }

  static async create(owner: string, repo: string, cloneUrl: string, branch: string = 'main', token?: string): Promise<GitSandbox> {
    const tempBase = path.join(os.tmpdir(), 'gitmedic-sandboxes');
    await fs.mkdir(tempBase, { recursive: true });

    const sessionDir = path.join(tempBase, `${owner}-${repo}-${Date.now()}`);
    await fs.mkdir(sessionDir, { recursive: true });

    const git = simpleGit();
    const authenticatedCloneUrl = token
      ? cloneUrl.replace('https://', `https://x-access-token:${token}@`)
      : cloneUrl;
    // Clone with depth 50 to have enough history while staying blazing fast
    await git.clone(authenticatedCloneUrl, sessionDir, ['--depth', '50', '--branch', branch]);

    return new GitSandbox(sessionDir);
  }

  async createCureBranch(issueNumber: number, titleSlug: string): Promise<string> {
    const sanitizedSlug = titleSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    const branchName = `gitmedic/cure-issue-${issueNumber}-${sanitizedSlug || 'patch'}`;
    await this.git.checkoutLocalBranch(branchName);
    return branchName;
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.workspaceDir, relativePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workspaceDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.workspaceDir, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(): Promise<string[]> {
    const status = await this.git.raw(['ls-files']);
    return status.split('\n').filter(Boolean);
  }

  async runCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspaceDir,
        timeout: 60000, // 60s timeout
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: err.code || 1,
      };
    }
  }

  async commitAndPush(branchName: string, message: string, token: string, cloneUrl: string): Promise<void> {
    await this.git.addConfig('user.name', 'GitMedic[bot]');
    await this.git.addConfig('user.email', 'support@gitmedic.dev');
    await this.git.add('.');
    await this.git.commit(message, undefined, {
      '--author': '"GitMedic[bot] <support@gitmedic.dev>"'
    });

    // Authenticated push using installation token
    const authenticatedUrl = cloneUrl.replace(
      'https://',
      `https://x-access-token:${token}@`
    );

    await this.git.push(authenticatedUrl, branchName);
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.workspaceDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to cleanup sandbox at ${this.workspaceDir}:`, err);
    }
  }
}
