import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// A relative base works at a custom domain, a user site, or any GitHub Pages subdirectory.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
