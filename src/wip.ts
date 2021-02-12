import { existsSync, lstatSync, readFileSync } from 'fs';
import * as pathM from 'path';
import { findImports } from './extract';

export function expand(dir: string, source: string, extensions = ['ts', 'js', 'json'] as const) {
  // mkdir -p a; echo 'console.log("file");' > a.js; echo 'console.log("dir");' > a/index.js; node -e 'require("./a")'
  const resolved = pathM.resolve(dir, source);

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
        const indexFile = pathM.join(resolved, `index.${ext}`);
        if (existsSync(indexFile)) {
          return indexFile;
        }
      }

      throw new Error(`'${resolved}' is a directory but has no index.${extensions} file`);
    }

    return resolved;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  throw new Error(`${dir} -> ${source} = ${resolved}, which does not exist`);
}

async function main() {
  const root = pathM.resolve(process.cwd(), process.argv[2]);
  const work: string[] = [root];
  const tree: Record<string, string[]> = {};
  while (work.length) {
    const path = work.pop()!;
    tree[path] = [];
    try {
      const references = findImports(readFileSync(path).toString('utf-8'));
      const directory = pathM.dirname(path);

      for (const r of references) {
        if (!r.source.startsWith('.')) {
          continue;
        }
        const found = expand(directory, r.source);
        tree[path].push(found);
        if (!(found in tree) && !work.includes(found)) {
          work.push(found);
        }
      }
    } catch (e) {
      e.message += ` reading '${path}'`;
      throw e;
    }
  }
  const output: string[] = [];
  postorder(tree, root, output, new Set());

  let out = '';
  for (const abs of output) {
    const rel = abs.substring(process.cwd().length);
    const p = rel.substring(0, rel.length - 3);
    out += `require('../..${p}');\n`;
  }

  console.log(out);

  //
  // const paths: string[] = [];
  // const msg = '';
  // for (const p of paths.map(p => p.substring(directory.length))) {
  //   const rel = p.replace(/\.ts$/, '');
  //   msg += `require('../../${rel}');\n`;
  // }
}

export function postorder(
  tree: Record<string, string[]>,
  item: string,
  output: string[],
  visited: Set<string>,
) {
  if (visited.has(item)) {
    return;
  }
  visited.add(item);
  const children = tree[item];
  for (const child of children) {
    postorder(tree, child, output, visited);
  }

  if (!output.includes(item)) {
    output.push(item);
  }
}
