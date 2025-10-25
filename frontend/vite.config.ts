import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000', // ваш бэкенд FastAPI
                changeOrigin: true,
                secure: false,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        globals: true,
        css: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
        coverage: {
            reporter: ['json-summary', 'text'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/app/main.tsx'],
            clean: true,
        },
    },
});