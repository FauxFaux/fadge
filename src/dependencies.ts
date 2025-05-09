import { dirname } from 'path';
import { findReferencesForSourceFile, Reference } from './find-references.js';
import { Dependencies } from './cycles.js';
import { resolveRelativeImportToPath } from './resolve-import.js';

export function dependenciesForPaths(
  inputPaths: string[],
  includeReference: (ref: Reference) => boolean,
) {
  const dependencies: Dependencies = {};

  for (const inputPath of inputPaths) {
    const references = findReferencesForSourceFile(inputPath);

    const inputDirName = dirname(inputPath);
    const referencedPaths = references
      .filter(includeReference)
      .map((ref) => resolveRelativeImportToPath(inputDirName, ref.source));

    dependencies[inputPath] = [...new Set(referencedPaths)].sort();
  }

  return dependencies;
}
