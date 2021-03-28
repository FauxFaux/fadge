### fadge

`fadge` can statically detect circular dependencies in imports in
Typescript code.

```
fadge detect-cycles [options] <globs...>

find circular dependencies between files

Options:
  --help             Show help                                                             [boolean]
  --version          Show version number                                                   [boolean]
  --allowIgnores     honour `// fadge-ignore reason` comments   [boolean] [default: false]
  --includeRequires  follow legacy `require()` where possible   [boolean] [default: true]
  --includeExports   follow `export {..} from..`                [boolean] [default: false]
```


### madge

[`madge`](https://github.com/pahen/madge) has similar functionality, but also
a lot of other stuff. It can't follow `require`s, `export`s, and has no
ignore mechanism.

It also adds around 270MB to `node_modules`, due to complex dependencies on
the typescript compiler. `fadge` evades this (totalling <15MB, probably <50kB)
by using babel's parser.
