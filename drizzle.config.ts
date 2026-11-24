import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/3.Arquitetura/Back-end/db/schema.ts',
  out: './database/migrations/drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
});
