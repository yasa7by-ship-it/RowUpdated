// test-api.js - Simple test script for API endpoints
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthRes = await fetch(`${API_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
  }

  console.log('\n');

  // Test 2: List SQL Files
  console.log('2️⃣ Listing SQL Files...');
  try {
    const listRes = await fetch(`${API_URL}/api/list-sql-files`);
    const listData = await listRes.json();
    console.log('✅ SQL Files:', listData);
  } catch (error) {
    console.error('❌ List Files failed:', error.message);
  }

  console.log('\n');

  // Test 3: Execute SQL Query
  console.log('3️⃣ Testing SQL Query Execution...');
  try {
    const sqlRes = await fetch(`${API_URL}/api/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT COUNT(*) as total FROM forecast_check_history;'
      })
    });
    const sqlData = await sqlRes.json();
    console.log('✅ SQL Query Result:', sqlData);
  } catch (error) {
    console.error('❌ SQL Query failed:', error.message);
  }

  console.log('\n');

  // Test 4: Execute SQL File (if exists)
  console.log('4️⃣ Testing SQL File Execution...');
  try {
    const fileRes = await fetch(`${API_URL}/api/execute-sql-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'FORECAST_ACCURACY_KPIS_TEST.sql.txt'
      })
    });
    const fileData = await fileRes.json();
    console.log('✅ SQL File Result:', fileData);
  } catch (error) {
    console.error('❌ SQL File execution failed:', error.message);
  }

  console.log('\n✅ All tests completed!');
}

testAPI().catch(console.error);





