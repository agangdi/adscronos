import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.css',
      },
    },
  },
});
