import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(), // Читает алиасы прямо из tsconfig.json
  ],
  server: {
    fs: {
      allow: ['..'], // Разрешает доступ к папке shared
    },
  },
  optimizeDeps: {
    exclude: ['@game/shared'], // Запрещает Vite кэшировать shared
  },
});