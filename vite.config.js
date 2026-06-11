import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: './',
    plugins: [react()],
    css: {
        postcss: {}
    },
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                gallery: 'gallery.html',
                records: 'records.html'
            }
        }
    }
});
