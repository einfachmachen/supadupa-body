import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mobile-first PWA, kein Backend — alles im Browser (IndexedDB).
export default defineConfig({
  plugins: [react()],
  base: './',
})
