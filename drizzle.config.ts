import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 6543,
    user: "postgres.wvnyiinrmfysabsfztii",
    password: "0nPJxjEsfpHLQNcb",
    database: "postgres",
    ssl: false
  },
});
