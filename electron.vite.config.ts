import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/main.ts') },
      },
      outDir: 'out/main',
    },
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
        formats: ['cjs'],
      },
      rollupOptions: {
        output: { entryFileNames: 'index.js' },
      },
      outDir: 'out/preload',
    },
  },
  renderer: {
    root: '.',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'index.html') },
      },
      outDir: 'out/renderer',
    },
    plugins: [vue()],
  },
})
