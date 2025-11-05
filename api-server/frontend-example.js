// Example usage from React/Frontend
export async function executeSQLFile(filename) {
  try {
    const response = await fetch('http://localhost:3001/api/execute-sql-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error executing SQL file:', error);
    throw error;
  }
}

export async function executeSQL(sql) {
  try {
    const response = await fetch('http://localhost:3001/api/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

export async function listSQLFiles() {
  try {
    const response = await fetch('http://localhost:3001/api/list-sql-files');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error listing SQL files:', error);
    throw error;
  }
}

// Usage example:
/*
import { executeSQLFile, executeSQL } from './api/sqlExecutor';

// Execute a SQL file
const result = await executeSQLFile('FORECAST_ACCURACY_KPIS_TEST.sql.txt');
console.log(result);

// Execute a raw SQL query
const queryResult = await executeSQL('SELECT COUNT(*) FROM forecast_check_history;');
console.log(queryResult);
*/




