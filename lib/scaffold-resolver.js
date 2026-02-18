import http from "http";
import https from "https";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SCAFFOLD_TYPE = "next-shadcn";
const FETCH_TIMEOUT_MS = 30_000;

const isHttpUrl = (url) =>
  url.startsWith("http://") || url.startsWith("https://");
const isFileUrl = (url) => url.startsWith("file://");

const defaultFetchText = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    const req = client
      .get(url, (res) => {
        if (res.statusCode >= 400) {
          resolve(null);
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
        res.on("error", reject);
      })
      .on("error", reject);

    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error(`Network timeout after ${FETCH_TIMEOUT_MS}ms: ${url}`));
    });
  });

const defaultConfirm = async (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
};

const defaultLog = (msg) => console.log(msg);

const resolveNamed = ({ type, packageRoot }) => ({
  extensionJsPath: path.resolve(
    packageRoot,
    "../ai/scaffolds",
    type,
    "bin/extension.js",
  ),
  manifestPath: path.resolve(
    packageRoot,
    "../ai/scaffolds",
    type,
    "SCAFFOLD-MANIFEST.yml",
  ),
  readmePath: path.resolve(packageRoot, "../ai/scaffolds", type, "README.md"),
});

const resolveFileUri = ({ uri }) => {
  const localPath = fileURLToPath(uri);
  return {
    extensionJsPath: path.join(localPath, "bin/extension.js"),
    manifestPath: path.join(localPath, "SCAFFOLD-MANIFEST.yml"),
    readmePath: path.join(localPath, "README.md"),
  };
};

const fetchAndSaveExtension = async ({ uri, folder, fetchText }) => {
  const scaffoldDir = path.join(folder, ".aidd/scaffold");
  await fs.ensureDir(scaffoldDir);
  await fs.ensureDir(path.join(scaffoldDir, "bin"));

  const readmePath = path.join(scaffoldDir, "README.md");
  const manifestPath = path.join(scaffoldDir, "SCAFFOLD-MANIFEST.yml");
  const extensionJsPath = path.join(scaffoldDir, "bin/extension.js");

  const [readme, manifest, extensionJs] = await Promise.all([
    fetchText(`${uri}/README.md`),
    fetchText(`${uri}/SCAFFOLD-MANIFEST.yml`),
    fetchText(`${uri}/bin/extension.js`),
  ]);

  if (readme) await fs.writeFile(readmePath, readme);
  if (manifest) await fs.writeFile(manifestPath, manifest);
  if (extensionJs) await fs.writeFile(extensionJsPath, extensionJs);

  return { extensionJsPath, manifestPath, readmePath };
};

const resolveExtension = async ({
  type,
  folder,
  packageRoot = __dirname,
  confirm = defaultConfirm,
  fetchText = defaultFetchText,
  log = defaultLog,
} = {}) => {
  const effectiveType =
    type || process.env.AIDD_CUSTOM_EXTENSION_URI || DEFAULT_SCAFFOLD_TYPE;

  let paths;

  if (isHttpUrl(effectiveType)) {
    const confirmed = await confirm(
      `\n⚠️  Warning: You are about to download and execute code from a remote URI:\n  ${effectiveType}\n\nThis code will run on your machine. Only proceed if you trust the source.\nContinue? (y/N): `,
    );
    if (!confirmed) {
      throw new Error("Remote extension download cancelled by user.");
    }
    await fs.ensureDir(folder);
    paths = await fetchAndSaveExtension({
      fetchText,
      folder,
      uri: effectiveType,
    });
  } else if (isFileUrl(effectiveType)) {
    paths = resolveFileUri({ uri: effectiveType });
  } else {
    paths = resolveNamed({ packageRoot, type: effectiveType });
  }

  const readmeExists = await fs.pathExists(paths.readmePath);
  if (readmeExists) {
    const readme = await fs.readFile(paths.readmePath, "utf-8");
    log(`\n${readme}`);
  }

  return paths;
};

export { resolveExtension };
