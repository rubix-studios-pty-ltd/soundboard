import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

// Common build options
const commonOptions = {
  bundle: true,
  sourcemap: true,
  external: ['electron'],
}

const buildOptions = [
  // Main process
  {
    ...commonOptions,
    entryPoints: ['main.ts'],
    platform: 'node',
    target: 'node18',
    outfile: 'dist/main.cjs',
    format: 'cjs'
  },
  // Preload script
  {
    ...commonOptions,
    entryPoints: ['src/preload.ts'],
    platform: 'node',
    target: 'node18',
    outfile: 'dist/preload.cjs',
    format: 'cjs',
  },
  // Renderer process
  {
    ...commonOptions,
    entryPoints: ['src/settings.ts', 'src/hotkeys.ts', 'src/sound.ts', 'src/audio-pool.ts'],
    platform: 'browser',
    target: 'es2020',
    outdir: 'dist',
    format: 'esm',
  }
]

if (isWatch) {
  // Watch mode
  const contexts = await Promise.all(
    buildOptions.map(options => esbuild.context(options))
  )
  await Promise.all(contexts.map(context => context.watch()))
  console.log('Watching for changes...')
} else {
  // Build once
  await Promise.all(buildOptions.map(options => esbuild.build(options)))
  console.log('Build complete')
}
