import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractProjectRef(supabaseUrl) {
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    return url.hostname.split('.')[0];
  } catch (error) {
    return null;
  }
}

async function loadSupabaseEnv() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', 'api-server', '.env'),
    path.resolve(__dirname, '..', 'api-server', 'env'),
    path.resolve(__dirname, '..', 'env'),
  ];

  for (const candidate of candidates) {
    try {
      const contents = await fs.readFile(candidate, 'utf8');
      const urlMatch = contents.match(/SUPABASE_URL\s*=\s*"?([^"\n]+)"?/i);
      const serviceMatch = contents.match(/SUPABASE_SERVICE_ROLE\s*=\s*"?([^"\n]+)"?/i);
      if (urlMatch && serviceMatch) {
        return {
          supabaseUrl: urlMatch[1].trim(),
          serviceRole: serviceMatch[1].trim(),
        };
      }
    } catch (error) {
      // ignore
    }
  }
  return { supabaseUrl: process.env.SUPABASE_URL, serviceRole: process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY };
}

async function run() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node exec-sql-management.js <file.sql> [file2.sql ...]');
    process.exit(1);
  }

  const { supabaseUrl, serviceRole } = await loadSupabaseEnv();
  if (!supabaseUrl || !serviceRole) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE. Please set them in environment variables or .env files.');
    process.exit(1);
  }

  const projectRef = extractProjectRef(supabaseUrl);
  if (!projectRef) {
    console.error('Unable to extract project reference from SUPABASE_URL.');
    process.exit(1);
  }

  for (const file of files) {
    const absolutePath = path.resolve(__dirname, '..', file);
    console.log('\n=== Executing via management API:', absolutePath, '===');
    const sql = await fs.readFile(absolutePath, 'utf8');

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Request failed:', response.status, response.statusText, text);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Success:', JSON.stringify(result, null, 2));
  }

  console.log('\nAll SQL scripts executed via management API.');
}

run();
