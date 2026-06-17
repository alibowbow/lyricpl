import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// `base` matches the GitHub Pages project sub-path so the built asset URLs
// resolve under https://alibowbow.github.io/lyricpl/. It is set for every
// command (build, dev and preview) so `npm run preview` serves the app at the
// same /lyricpl/ path the production build expects — otherwise preview would
// look for assets at the wrong path and render a blank page.
export default defineConfig({
  base: '/lyricpl/',
  plugins: [react()],
});
