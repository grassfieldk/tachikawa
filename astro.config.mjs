import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  env: {
    schema: {
      DATABASE_URL_WEB: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
