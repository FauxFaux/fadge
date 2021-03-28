import { readFileSync } from 'fs';
import * as path from 'path';
import { findImports, Reference } from './find-references';
import { circularDependencies, Dependencies, removeDuplicateCycles } from './cycles';
import { resolveRelativeImportToPath } from './resolve-import';
import { sortBy } from './dosh';
import fg = require('fast-glob');
import yargs = require('yargs');

const { hideBin } = require('yargs/helpers');

export async function allFiles() {
  const paths = yargs(hideBin(process.argv)).argv._ as string[];
  const inputPaths = await fg(paths);
  const modules: Dependencies = {};
  for (const inputPath of inputPaths
    .map((input) => path.resolve(input))
    .sort()) {
    const sourceText = readFileSync(inputPath, { encoding: 'utf-8' });
    const inputDirName = path.dirname(inputPath);

    let references: Reference[];
    try {
      references = findImports(sourceText);
    } catch (e) {
      e.message += ` while parsing ${inputPath}`;
      throw e;
    }

    const referencedPaths = new Set<string>();
    for (const ref of references) {
      if (ref.kind === 'export' || ref.typeOnly) {
        continue;
      }

      if (!ref.source.startsWith('.')) {
        continue;
      }

      referencedPaths.add(
        resolveRelativeImportToPath(inputDirName, ref.source),
      );
    }

    modules[inputPath] = [...referencedPaths].sort();
  }

  const problems = circularDependencies(modules);
  sortBy(
    problems,
    ({ length }) => length,
    ([item]) => item,
  );
  removeDuplicateCycles(problems);
  console.log(problems);
}

allFiles().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
