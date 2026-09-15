import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// GitHub Pages serves this as a project site under /soully-skin-beta/, so
// asset URLs need that prefix there; Vercel/Netlify serve from the domain
// root and don't set this env var, so they keep the default '/'.
export default defineConfig({ plugins: [react()], base: process.env.GH_PAGES ? '/soully-skin-beta/' : '/' })
