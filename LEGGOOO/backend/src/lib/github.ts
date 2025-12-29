/**
 * GitHub API Service
 * Handles repository operations: import, push, and file management
 */

import { decryptToken } from './encryption.js';
import { supabaseAdmin } from './supabase.js';

const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  clone_url: string;
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  download_url?: string;
}

interface GitHubTree {
  sha: string;
  tree: Array<{
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
  }>;
  truncated: boolean;
}

interface GitHubBlob {
  sha: string;
  content: string;
  encoding: string;
  size: number;
}

interface GitHubCommit {
  sha: string;
  message: string;
  tree: { sha: string };
  parents: Array<{ sha: string }>;
}

interface GitHubRef {
  ref: string;
  object: { sha: string; type: string };
}

export interface ImportResult {
  success: boolean;
  filesImported: number;
  errors: string[];
}

export interface PushResult {
  success: boolean;
  commitSha?: string;
  message?: string;
  error?: string;
}

/**
 * Get user's decrypted GitHub token
 */
export async function getUserGitHubToken(userId: string): Promise<string | null> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('github_token')
    .eq('id', userId)
    .single();

  if (error || !user?.github_token) {
    return null;
  }

  try {
    return decryptToken(user.github_token);
  } catch {
    console.error('Failed to decrypt GitHub token');
    return null;
  }
}

/**
 * Make authenticated request to GitHub API
 */
async function githubRequest<T>(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * List user's repositories
 */
export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const pageRepos = await githubRequest<GitHubRepo[]>(
      token,
      `/user/repos?per_page=${perPage}&page=${page}&sort=updated`
    );

    repos.push(...pageRepos);

    if (pageRepos.length < perPage) break;
    page++;

    // Limit to 500 repos
    if (repos.length >= 500) break;
  }

  return repos;
}

/**
 * Get repository info
 */
export async function getRepoInfo(token: string, owner: string, repo: string): Promise<GitHubRepo> {
  return githubRequest<GitHubRepo>(token, `/repos/${owner}/${repo}`);
}

/**
 * Get repository tree recursively
 */
export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubTree> {
  return githubRequest<GitHubTree>(
    token,
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
}

/**
 * Get file content from repository
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
  const content = await githubRequest<GitHubContent>(token, endpoint);

  if (content.type !== 'file' || !content.content) {
    throw new Error(`${path} is not a file or has no content`);
  }

  // Decode base64 content
  return Buffer.from(content.content, 'base64').toString('utf-8');
}

/**
 * Get blob content by SHA
 */
export async function getBlobContent(
  token: string,
  owner: string,
  repo: string,
  sha: string
): Promise<string> {
  const blob = await githubRequest<GitHubBlob>(
    token,
    `/repos/${owner}/${repo}/git/blobs/${sha}`
  );

  if (blob.encoding === 'base64') {
    return Buffer.from(blob.content, 'base64').toString('utf-8');
  }

  return blob.content;
}

/**
 * Import repository files into workspace
 * Respects file size limits and common ignore patterns
 */
export async function importRepository(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  workspaceId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    filesImported: 0,
    errors: [],
  };

  // Patterns to ignore
  const ignorePatterns = [
    /^\.git\//,
    /node_modules\//,
    /\.env$/,
    /\.env\..+$/,
    /^dist\//,
    /^build\//,
    /^\.next\//,
    /^coverage\//,
    /^__pycache__\//,
    /\.pyc$/,
    /^\.venv\//,
    /^venv\//,
    /\.DS_Store$/,
    /^\.idea\//,
    /^\.vscode\/(?!settings\.json|extensions\.json)/,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
  ];

  // Max file size (500KB)
  const MAX_FILE_SIZE = 500 * 1024;

  // Supported text file extensions
  const textExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.java', '.go', '.rs', '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.hpp',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml', '.toml', '.xml',
    '.md', '.mdx', '.txt', '.rst',
    '.sql', '.graphql', '.gql',
    '.sh', '.bash', '.zsh', '.fish', '.ps1',
    '.vue', '.svelte', '.astro',
    '.dockerfile', '.gitignore', '.env.example',
    '.eslintrc', '.prettierrc', '.editorconfig',
  ]);

  try {
    // Get repository tree
    const tree = await getRepoTree(token, owner, repo, branch);

    if (tree.truncated) {
      result.errors.push('Repository tree was truncated. Some files may not be imported.');
    }

    // Filter files to import
    const filesToImport = tree.tree.filter((item) => {
      // Only files (blobs)
      if (item.type !== 'blob') return false;

      // Check ignore patterns
      for (const pattern of ignorePatterns) {
        if (pattern.test(item.path)) return false;
      }

      // Check file size
      if (item.size && item.size > MAX_FILE_SIZE) {
        result.errors.push(`Skipped ${item.path}: file too large (${Math.round(item.size / 1024)}KB)`);
        return false;
      }

      // Check extension
      const ext = item.path.substring(item.path.lastIndexOf('.')).toLowerCase();
      const filename = item.path.split('/').pop() || '';

      // Allow files without extension if they match known names
      const knownFilenames = ['Dockerfile', 'Makefile', 'Procfile', 'Gemfile', 'Rakefile'];
      if (!ext && !knownFilenames.includes(filename)) {
        return false;
      }

      // Check if text file
      if (ext && !textExtensions.has(ext)) {
        // Allow known config files without typical extensions
        if (!filename.endsWith('rc') && !filename.endsWith('config')) {
          return false;
        }
      }

      return true;
    });

    // Limit number of files (max 200)
    const MAX_FILES = 200;
    if (filesToImport.length > MAX_FILES) {
      result.errors.push(`Repository has ${filesToImport.length} files. Only importing first ${MAX_FILES}.`);
      filesToImport.splice(MAX_FILES);
    }

    // Import files in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < filesToImport.length; i += BATCH_SIZE) {
      const batch = filesToImport.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item) => {
          try {
            const content = await getBlobContent(token, owner, repo, item.sha);

            // Detect language
            const ext = item.path.substring(item.path.lastIndexOf('.')).toLowerCase();
            const language = detectLanguage(ext);

            // Upsert file
            const { error } = await supabaseAdmin
              .from('files')
              .upsert(
                {
                  workspace_id: workspaceId,
                  path: item.path,
                  content,
                  language,
                },
                { onConflict: 'workspace_id,path' }
              );

            if (error) {
              result.errors.push(`Failed to save ${item.path}: ${error.message}`);
            } else {
              result.filesImported++;
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            result.errors.push(`Failed to import ${item.path}: ${message}`);
          }
        })
      );
    }

    result.success = result.filesImported > 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`Import failed: ${message}`);
  }

  return result;
}

/**
 * Push workspace changes to GitHub
 */
export async function pushToGitHub(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  workspaceId: string,
  commitMessage: string
): Promise<PushResult> {
  try {
    // Get current branch ref
    const ref = await githubRequest<GitHubRef>(
      token,
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`
    );
    const currentCommitSha = ref.object.sha;

    // Get current commit
    const currentCommit = await githubRequest<GitHubCommit>(
      token,
      `/repos/${owner}/${repo}/git/commits/${currentCommitSha}`
    );

    // Get workspace files
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('path, content')
      .eq('workspace_id', workspaceId);

    if (error || !files || files.length === 0) {
      return { success: false, error: 'No files to push' };
    }

    // Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const blob = await githubRequest<{ sha: string }>(
          token,
          `/repos/${owner}/${repo}/git/blobs`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8',
            }),
          }
        );

        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create new tree
    const newTree = await githubRequest<{ sha: string }>(
      token,
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: currentCommit.tree.sha,
          tree: treeItems,
        }),
      }
    );

    // Create commit
    const newCommit = await githubRequest<GitHubCommit>(
      token,
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: commitMessage,
          tree: newTree.sha,
          parents: [currentCommitSha],
        }),
      }
    );

    // Update branch ref
    await githubRequest(
      token,
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          sha: newCommit.sha,
        }),
      }
    );

    return {
      success: true,
      commitSha: newCommit.sha,
      message: `Successfully pushed ${files.length} files`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Detect language from file extension
 */
function detectLanguage(ext: string): string {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.xml': 'xml',
    '.md': 'markdown',
    '.mdx': 'markdown',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.ps1': 'powershell',
    '.vue': 'vue',
    '.svelte': 'svelte',
  };

  return languageMap[ext] || 'plaintext';
}
