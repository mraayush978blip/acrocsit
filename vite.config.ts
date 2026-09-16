import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/supabase': {
          target: env.VITE_SUPABASE_URL || 'https://rgowcovsultizysqwrff.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/supabase/, '')
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Acropolis Attendance Management System v2',
          short_name: 'AcroAMS',
          description: 'Advanced Attendance Management System for Acropolis Institute',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'splash-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'splash-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        stream: path.resolve(__dirname, './shims/stream.js'),
      }
    },
    build: {
      // esbuild is Vite's built-in minifier — written in Go, 10-20x faster than Terser,
      // with identical output quality for this project's needs.
      minify: 'esbuild',
      target: 'es2020',
      esbuildOptions: {
        // Strip console.* and debugger statements from production builds
        drop: ['console', 'debugger'],
        // Remove comments for a smaller bundle
        legalComments: 'none',
      },
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // Split into separate cacheable chunks: when only Admin.tsx changes,
          // browsers only re-download the 'views' chunk, not the whole vendor bundle.
          manualChunks: {
            'react-core':  ['react', 'react-dom'],
            'routing':     ['react-router-dom'],
            'supabase':    ['@supabase/supabase-js'],
            'ui':          ['framer-motion', 'lucide-react'],
          },
        },
      },
    }
  };
});
