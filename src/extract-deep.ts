import * as t from '@babel/types';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { assertUnreachable, DefaultRecord, invariant, string } from './dosh';

interface Reference {
  source: string;
  kind: 'import' | 'export' | 'require';
  typeOnly: boolean;
}

type RelativePath = string;

export function extraction(src: string): Reference[] {
  const tree = parser.parse(src, {
    sourceType: 'unambiguous',
    plugins: ['typescript', 'classProperties'],
  });
  const references: Reference[] = [];

  type SpecialImport = 'a namespace' | 'the default';
  const importFrom = new DefaultRecord(() => new Set<string | SpecialImport>());
  const implots: Record<string, RelativePath> = {};

  traverse(tree, {
    ImportDeclaration(path) {
      const source = string(path.node.source);

      if (path.node.importKind === 'type') {
        return;
      }

      for (const specifier of path.node.specifiers) {
        switch (specifier.type) {
          case 'ImportDefaultSpecifier':
            implots[specifier.local.name] = source;
            importFrom.get(source).add('the default');
            break;
          case 'ImportNamespaceSpecifier':
            implots[specifier.local.name] = source;
            importFrom.get(source).add('a namespace');
            break;
          case 'ImportSpecifier':
            implots[specifier.local.name] = source;
            invariant(
              t.isIdentifier(specifier.imported),
              'importing strings is experimental syntax',
            );
            importFrom.get(source).add(specifier.imported.name);
            break;
          default:
            assertUnreachable(specifier);
        }
      }
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
        kind: 'import',
        typeOnly: path.node.exportKind === 'type',
      });
    },
    Identifier(path) {
      const ident = path.node.name;
      const implot = implots[ident];
      if (!implot) {
        return;
      }
      const top = path.findParent((path) => t.isProgram(path.parent));
      switch (top?.node?.type) {
        case undefined:
          throw path.buildCodeFrameError('not within a file?');
        case 'ImportDeclaration':
          break;
        case 'ExportNamedDeclaration': {
          const exp = top.node;
          switch (exp.declaration?.type) {
            case 'FunctionDeclaration': {
              const fname = exp.declaration.id?.name;
              console.log(`${fname} -> "${implot}"[${ident}]`);
            }
          }
          break;
        }
      }
    },
    CallExpression(path) {
      // if (t.isIdentifier(path.node.callee)) {
      //   const implot = implots[path.node.callee.name];
      //   if (implot) {
      //     const found = path.findParent((path) => path.node.type === 'FunctionDeclaration').node.id.name;
      //     console.log(found, implot);
      //   }
      // }
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
      });
    },
  });

  return references;
}
