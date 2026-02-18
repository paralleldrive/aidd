import http from "http";
import https from "https";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultFetchText = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    client
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
    type || process.env.AIDD_CUSTOM_EXTENSION_URI || "next-shadcn";

  let paths;

  if (
    effectiveType.startsWith("http://") ||
    effectiveType.startsWith("https://")
  ) {
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
  } else if (effectiveType.startsWith("file://")) {
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
