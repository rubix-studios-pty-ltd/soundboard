import * as esbuild from "esbuild"

const isWatch = process.argv.includes("--watch")
const isDev = process.env.NODE_ENV !== "production"

const baseOptions = {
  bundle: true,
  sourcemap: isDev,
  minify: !isDev,
  minifyWhitespace: !isDev,
  minifyIdentifiers: !isDev,
  minifySyntax: !isDev,
  external: ["electron"],
  loader: { ".tsx": "tsx", ".ts": "ts", ".js": "js", ".jsx": "jsx" },
  jsx: "automatic",
  target: "es2020",
  treeShaking: true,
  metafile: true,
  legalComments: isDev ? "inline" : "none",
  drop: isDev ? [] : ["console", "debugger"],
}

const nodeOptions = {
  ...baseOptions,
  platform: "node",
  format: "cjs",
  target: "node18",
}

const browserOptions = {
  ...baseOptions,
  platform: "browser",
  format: "esm",
  splitting: true,
  outdir: "dist/app",
  chunkNames: "chunks/[name]-[hash]",
  assetNames: isDev ? "[name]-[hash]" : "[hash]",
  define: {
    "process.env.NODE_ENV": isDev ? '"development"' : '"production"',
    "process.env.RUNNING_IN_ELECTRON": "true",
    global: "window",
  },
}

const buildOptions = [
  {
    ...nodeOptions,
    entryPoints: ["main.ts"],
    outfile: "dist/main.cjs",
  },
  {
    ...nodeOptions,
    entryPoints: ["src/utils/preload.ts"],
    outfile: "dist/preload.cjs",
  },
  {
    ...browserOptions,
    entryPoints: ["src/app/index.tsx"],
    inject: ["./react-shim.mjs"],
  },
]

if (isWatch) {
  console.log("Starting watch mode...")
  const contexts = await Promise.all(
    buildOptions.map((options) => esbuild.context(options))
  )

  await Promise.all(contexts.map((context) => context.watch()))
  console.log("Watching for changes...")
} else {
  console.log("Building...")
  await Promise.all(buildOptions.map((options) => esbuild.build(options)))
  console.log("Build complete")
}
