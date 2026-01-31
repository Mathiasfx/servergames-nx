import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root:__dirname,
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: '../../dist/packages/trivia-client',
    minify: 'terser',
    sourcemap: false,
  },
});
