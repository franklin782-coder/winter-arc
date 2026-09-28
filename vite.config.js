import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: сайт живёт по адресу https://<user>.github.io/winter-arc/
// По умолчанию base = '/winter-arc/' (абсолютные пути к ассетам под подпапкой репозитория).
// Для другого хостинга/подпапки: VITE_BASE=./ npm run build  (относительные пути — работают где угодно)
// или VITE_BASE=/ npm run build (корень домена). В dev-режиме всегда '/'.
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 700, rollupOptions: { output: { manualChunks: { recharts: ['recharts'], react: ['react', 'react-dom'] } } } },
  base: command === 'serve' && !isPreview ? '/' : process.env.VITE_BASE || '/winter-arc/',
}));
