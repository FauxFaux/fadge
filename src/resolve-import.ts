import { existsSync, lstatSync } from 'fs';
import * as path from 'path';

export function resolveRelativeImportToPath(
  dir: string,
  relativeImport: string,
  extensions = ['ts', 'js', 'json'] as const,
) {
  // mkdir -p a; echo 'console.log("file");' > a.js; echo 'console.log("dir");' > a/index.js; node -e 'require("./a")'
  const resolved = path.resolve(dir, relativeImport);

  for (const ext of extensions) {
    const asFile = `${resolved}.${ext}`;
    if (existsSync(asFile)) {
      return asFile;
    }
  }

  try {
    const stat = lstatSync(resolved);
    if (stat.isDirectory()) {
      for (const ext of extensions) {
        const indexFile = path.join(resolved, `index.${ext}`);
        if (existsSync(indexFile)) {
          return indexFile;
        }
      }

      throw new Error(
        `'${resolved}' is a directory but has no index.${extensions} file`,
      );
    }

    return resolved;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  throw new Error(
    `${dir} -> ${relativeImport} = ${resolved}, which does not exist`,
  );
}
