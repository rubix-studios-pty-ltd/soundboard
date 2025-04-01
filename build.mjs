import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

const buildOptions = {
  entryPoints: ['src/app/index.tsx'],
  bundle: true,
  sourcemap: true,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.js': 'js', '.jsx': 'jsx' },
  jsx: 'automatic',
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

if (isWatch) {
  const context = await esbuild.context(buildOptions)
  await context.watch()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
  console.log('Build complete')
}
