import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// `base` must match the GitHub Pages project sub-path so built asset URLs
// resolve under https://alibowbow.github.io/lyricpl/. The dev server stays at
// root ('/') so `npm run dev` is unaffected.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lyricpl/' : '/',
  plugins: [react()],
}));
