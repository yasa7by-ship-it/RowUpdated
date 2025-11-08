import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDatabaseUrl(connectionString) {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: Number(url.port || 5432),
      user: decodeURIComponent(url.username || 'postgres'),
      password: decodeURIComponent(url.password || ''),
      database: (url.pathname || '/postgres').slice(1) || 'postgres',
      ssl: { rejectUnauthorized: false },
    };
  } catch (error) {
    console.warn('⚠️  Failed to parse DATABASE_URL, falling back to individual env vars. Error:', error.message);
    return null;
  }
}

async function loadDefaultEnvDatabaseUrl() {
  const envPath = path.resolve(__dirname, '..', 'env');
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const match = raw.match(/DATABASE_URL\s*=\s*"?([^"]+)"?/i);
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

async function buildDbConfig() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    databaseUrl = await loadDefaultEnvDatabaseUrl();
  }

  let config = parseDatabaseUrl(databaseUrl);
  if (config) {
    return config;
  }

  return {
    host: process.env.DB_HOST || 'db.bojrgkiqsahuwufbkacm.supabase.co',
    port: Number(process.env.DB_PORT || 6543),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Abusupabase@5051',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  };
}

async function run() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: npm run sql <file.sql> [file2.sql ...]');
    process.exit(1);
  }

  const dbConfig = await buildDbConfig();
  const client = new Client(dbConfig);

  try {
    await client.connect();

    for (const relativeFile of files) {
      const absoluteFile = path.resolve(__dirname, '..', relativeFile);
      console.log('\n=== Executing SQL file:', absoluteFile, '===');
      const sql = await fs.readFile(absoluteFile, 'utf8');
      await client.query(sql);
      console.log('✅ Success');
    }

    console.log('\nAll SQL scripts executed successfully.');
  } catch (error) {
    console.error('\n❌ Error executing SQL:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

run();


