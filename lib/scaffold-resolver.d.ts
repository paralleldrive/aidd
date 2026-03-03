/** Resolved paths for a scaffold extension. */
export interface ScaffoldPaths {
  readmePath: string;
  manifestPath: string;
  extensionJsPath: string;
  downloaded: boolean;
}

export interface ResolveExtensionOptions {
  /** Named scaffold type, HTTP/HTTPS URI, or file:// URI. Defaults to env var or user config. */
  type?: string;
  /** Target project folder. */
  folder?: string;
  /** Package root for resolving named scaffolds. Defaults to this module's directory. */
  packageRoot?: string;
  /** Confirmation prompt function. Defaults to interactive readline prompt. */
  confirm?: (message: string) => Promise<boolean>;
  /** Tarball download function. Defaults to fetch + tar extraction. */
  download?: (url: string, destPath: string) => Promise<void>;
  /** GitHub release resolver. Defaults to GitHub API lookup. */
  resolveRelease?: (repoUrl: string) => Promise<string>;
  /** Log function. Defaults to console.log. */
  log?: (msg: string) => void;
  /** Config reader. Defaults to reading ~/.aidd/config.yml. */
  readConfigFn?: (options?: {
    configFile?: string;
  }) => Promise<Record<string, unknown>>;
}

/**
 * Resolves the scaffold extension source and returns paths to its files.
 * Supports named scaffolds, file:// URIs, and remote HTTPS URIs.
 */
export function resolveExtension(
  options?: ResolveExtensionOptions,
): Promise<ScaffoldPaths>;

/**
 * Resolves the latest release tarball URL from a GitHub repository.
 * Respects GITHUB_TOKEN for private repos and higher rate limits.
 */
export function defaultResolveRelease(repoUrl: string): Promise<string>;

/**
 * Downloads a tarball from url and extracts it into destPath.
 * Respects GITHUB_TOKEN for GitHub hostnames.
 */
export function defaultDownloadAndExtract(
  url: string,
  destPath: string,
): Promise<void>;
