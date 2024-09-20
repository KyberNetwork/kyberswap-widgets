import { defineConfig } from 'tsup'
import svgrPlugin from 'esbuild-plugin-svgr'

export default defineConfig({
  entry: { widget: 'src/components/index.ts' },
  format: ['esm', 'cjs'], // Equivalent to 'es' and 'umd'
  outDir: 'dist',
  target: 'esnext',
  clean: true,
  dts: true, // This generates type declaration files
  minify: true, // Set to true if you want to minify the output
  external: ['react', 'react-dom'], // Externals
  esbuildPlugins: [
    svgrPlugin({
      svgo: true, // Enable SVGO optimization
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: { removeViewBox: false }, // Retain the viewBox attribute in SVGs
            },
          },
        ],
      },
    }),
  ],
  esbuildOptions(options) {
    options.globalName = 'Widgets'
    options.define = {
      global: 'globalThis',
    }
    options.supported = {
      bigint: true,
    }
  },
  banner: {
    js: `
      // eslint-disable
    `,
  },
})
