import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const commonOptions = {
  bundle: true,
  sourcemap: true,
  external: ['electron'],
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.js': 'js', '.jsx': 'jsx' },
  jsx: 'automatic',
  platform: 'node',
  target: 'es2020',
}

const buildOptions = [
  {
    ...commonOptions,
    entryPoints: ['main.ts'],
    platform: 'node',
    target: 'node18',
    outfile: 'dist/main.cjs',
    format: 'cjs'
  },
  {
    ...commonOptions,
    entryPoints: ['src/utils/preload.ts'],
    platform: 'node',
    target: 'node18',
    outfile: 'dist/preload.cjs',
    format: 'cjs',
  },
  {
    ...commonOptions,
    entryPoints: ['src/app/index.tsx'],
    platform: 'browser',
    target: 'es2020',
    outdir: 'dist',
    format: 'esm',
    define: {
      'process.env.NODE_ENV': '"development"',
      'global': 'window'
    },
    inject: ['./react-shim.mjs']
  }
]

if (isWatch) {
  const contexts = await Promise.all(
    buildOptions.map(options => esbuild.context(options))
  )
  await Promise.all(contexts.map(context => context.watch()))
  console.log('Watching for changes...')
} else {
  await Promise.all(buildOptions.map(options => esbuild.build(options)))
  console.log('Build complete')
}
