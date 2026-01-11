import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Ensure Vite loads environment variables from the repository root (where .env lives)
  envDir: path.resolve(__dirname),
  // Serve files from the `src` folder in dev so `http://localhost:3000/` maps to `src/index.html`.
  root: path.resolve(__dirname, './src'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // Make sure production build writes to the project-level `dist` folder
    outDir: path.resolve(__dirname, 'dist'),
    sourcemap: true,
  },
})
