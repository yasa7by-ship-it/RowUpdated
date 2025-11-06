// server.js
import express from 'express';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (allow frontend to access API)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute SQL file
 * @param {string} filePath - Path to SQL file
 * @returns {Promise<Object>} Query results
 */
async function executeSQLFile(filePath) {
  const client = await pool.connect();
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL file by semicolons (handles multiple queries)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'));
    
    const results = [];
    
    for (const query of queries) {
      // Skip comments and empty lines
      const cleanQuery = query
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
        .join('\n')
        .trim();
      
      if (!cleanQuery) continue;
      
      try {
        const result = await client.query(cleanQuery);
        results.push({
          query: cleanQuery.substring(0, 100) + '...',
          rowCount: result.rowCount,
          rows: result.rows,
          success: true
        });
      } catch (error) {
        results.push({
          query: cleanQuery.substring(0, 100) + '...',
          error: error.message,
          success: false
        });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error
    };
  } finally {
    client.release();
  }
}

/**
 * Execute raw SQL query
 * @param {string} sql - SQL query string
 * @returns {Promise<Object>} Query results
 */
async function executeSQL(sql) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return {
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      columns: result.fields?.map(f => f.name) || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error
    };
  } finally {
    client.release();
  }
}

// Routes

/**
 * POST /api/execute-sql-file
 * Execute a SQL file from the sql-files directory
 * Body: { filename: "migration_001.sql" }
 */
app.post('/api/execute-sql-file', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }
    
    // Security: Only allow files from sql-files directory
    const filePath = path.join(__dirname, 'sql-files', filename);
    
    // Prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(__dirname, 'sql-files'))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Invalid file path'
      });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${filename}`
      });
    }
    
    console.log(`📄 Executing SQL file: ${filename}`);
    const result = await executeSQLFile(filePath);
    
    res.json({
      success: result.success,
      filename,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Error executing SQL file:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
});

/**
 * POST /api/execute-sql
 * Execute raw SQL query
 * Body: { sql: "SELECT * FROM forecast_check_history LIMIT 10;" }
 */
app.post('/api/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }
    
    // Security: Prevent dangerous operations (optional)
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperSql = sql.toUpperCase();
    
    // Only block if not in admin mode
    if (!req.body.admin && dangerousKeywords.some(keyword => upperSql.includes(keyword))) {
      return res.status(403).json({
        success: false,
        error: 'Dangerous operations are not allowed. Use /api/execute-sql-file for migrations.'
      });
    }
    
    console.log(`🔍 Executing SQL query: ${sql.substring(0, 100)}...`);
    const result = await executeSQL(sql);
    
    res.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Error executing SQL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
});

/**
 * GET /api/list-sql-files
 * List all available SQL files
 */
app.get('/api/list-sql-files', (req, res) => {
  try {
    const sqlFilesDir = path.join(__dirname, 'sql-files');
    
    if (!fs.existsSync(sqlFilesDir)) {
      fs.mkdirSync(sqlFilesDir, { recursive: true });
    }
    
    const files = fs.readdirSync(sqlFilesDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.sql.txt'))
      .map(file => ({
        filename: file,
        size: fs.statSync(path.join(sqlFilesDir, file)).size,
        modified: fs.statSync(path.join(sqlFilesDir, file)).mtime
      }))
      .sort((a, b) => b.modified - a.modified);
    
    res.json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Error listing SQL files:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📁 SQL files directory: ${path.join(__dirname, 'sql-files')}`);
  console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

export default app;





