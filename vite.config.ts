import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(async ({mode}) => {
  const env = loadEnv(mode, '.', '');
  let tailwindPlugin: any = null;
  try {
    const mod = await import('@tailwindcss/vite');
    tailwindPlugin = mod && (mod.default || mod);
  } catch (err: any) {
    // If optional native bindings fail to load, continue without plugin to avoid build crash.
    // Vite will still process CSS via PostCSS config if present.
    console.warn('Failed to load @tailwindcss/vite plugin:', err?.message || err);
    tailwindPlugin = () => ({ name: 'noop-tailwind' });
  }

  return {
    plugins: [react(), tailwindPlugin && tailwindPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
