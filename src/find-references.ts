import { readFileSync } from 'node:fs';
import * as t from '@babel/types';
import * as parser from '@babel/parser';
import traverseDefaultBroken from '@babel/traverse';
import { string } from './dosh.js';

const traverse = traverseDefaultBroken.default;

export interface Reference {
  source: string;
  kind: 'import' | 'export' | 'require';
  typeOnly: boolean;
  ignored: boolean;
}

export function findReferencesForSourceFile(inputPath: string) {
  const sourceText = readFileSync(inputPath, { encoding: 'utf-8' });

  try {
    return findReferencesForSource(sourceText);
  } catch (e) {
    if (typeof e === 'object') {
      (e as { message: string }).message += ` while parsing ${inputPath}`;
    }
    throw e;
  }
}

export function findReferencesForSource(src: string): Reference[] {
  const tree = parser.parse(src, {
    sourceType: 'unambiguous',
    plugins: ['typescript', 'classProperties'],
  });
  const references: Reference[] = [];
  traverse(tree, {
    ImportDeclaration(path) {
      const source = string(path.node.source);
      const ignored =
        path.node.leadingComments?.some((comment) =>
          comment.value.trim().startsWith('fadge-ignore '),
        ) ?? false;
      references.push({
        ignored,
        source,
        kind: 'import',
        typeOnly:
          path.node.importKind === 'type' ||
          path.node.specifiers.every(
            (s) => s.type !== 'ImportSpecifier' || s.importKind === 'type',
          ),
      });
    },
    ExportNamedDeclaration(path) {
      if (path.node.source === null) {
        // export = foo;
        // export {};
        return;
      }
      const source = string(path.node.source);
      references.push({
        source,
        kind: 'export',
        typeOnly: path.node.exportKind === 'type',
        // TODO: we can compute this, but does anyone care?
        ignored: false,
      });
    },
    CallExpression(path) {
      if (1 !== path.node.arguments.length) {
        return;
      }

      const callee = path.node.callee;
      if (!t.isIdentifier(callee)) {
        return;
      }
      if ('require' !== callee.name) {
        return;
      }

      const arg = path.node.arguments[0];

      // TODO: improve string()?
      if (t.isTemplateLiteral(arg)) {
        return;
      }
      // __dirname + '../foo.json'
      if (t.isBinaryExpression(arg)) {
        return;
      }

      const source = string(arg);

      references.push({
        source,
        kind: 'require',
        typeOnly: false,
        // convert it to an import, eh
        ignored: false,
      });
    },
  });

  return references;
}
