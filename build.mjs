import { cpSync, rmSync } from 'node:fs'
import path from 'node:path'
import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')
const isDev = process.env.NODE_ENV !== 'production'

const baseOptions = {
  bundle: true,
  sourcemap: isDev,
  minify: !isDev,
  minifyWhitespace: !isDev,
  minifyIdentifiers: !isDev,
  minifySyntax: !isDev,
  external: ['electron'],
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.js': 'js', '.jsx': 'jsx' },
  jsx: 'automatic',
  target: 'esnext',
  treeShaking: true,
  metafile: true,
  legalComments: isDev ? 'inline' : 'none',
  drop: isDev ? [] : ['console', 'debugger'],
}

const nodeOptions = {
  ...baseOptions,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
}

const browserOptions = {
  ...baseOptions,
  platform: 'browser',
  format: 'esm',
  splitting: true,
  outdir: 'dist/app',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: isDev ? '[name]-[hash]' : '[hash]',
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
    'process.env.RUNNING_IN_ELECTRON': 'true',
    global: 'window',
  },
}

const buildOptions = [
  {
    ...nodeOptions,
    entryPoints: ['main.ts'],
    outfile: 'dist/main.cjs',
  },
  {
    ...nodeOptions,
    entryPoints: ['src/lib/system/preload.ts'],
    outfile: 'dist/preload.cjs',
  },
  {
    ...browserOptions,
    entryPoints: ['src/app/main/index.tsx'],
    outdir: 'dist/app/main',
    entryNames: 'index',
    inject: ['./react-shim.mjs'],
  },
  {
    ...browserOptions,
    entryPoints: ['src/app/popout/index.tsx'],
    outdir: 'dist/app/popout',
    entryNames: 'index',
    inject: ['./react-shim.mjs'],
  },
]

if (isWatch) {
  Promise.all(buildOptions.map((options) => esbuild.context(options)))
    .then((contexts) => Promise.all(contexts.map((context) => context.watch())))
    .then(() => {
      console.log('Watching for changes...')
    })
    .catch((err) => {
      console.error('Watch mode failed:', err)
      process.exit(1)
    })
} else {
  try {
    rmSync('dist', { recursive: true, force: true })
    await Promise.all(buildOptions.map((options) => esbuild.build(options)))
    cpSync(
      path.resolve('src/vendor'),
      path.resolve('dist/vendor'),
      { recursive: true }
    )
  } catch (err) {
    console.error('Build failed:', err)
    process.exit(1)
  }
}
