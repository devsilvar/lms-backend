// Prisma 7 does NOT auto-load .env files - we must load them explicitly
import 'dotenv/config';
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})