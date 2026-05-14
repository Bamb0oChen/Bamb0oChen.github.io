import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    base: './',
    plugins: [vue()],
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
