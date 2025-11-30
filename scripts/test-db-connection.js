const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL and individual environment variables
let poolConfig;

if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL format: postgresql://user:password@host:port/database
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: 'postgres', // Connect to default postgres database first
    user: url.username,
    password: url.password,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres', // Connect to default postgres database first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    let dbName;
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`Using DATABASE_URL format`);
      console.log(`Host: ${url.hostname}`);
      console.log(`Port: ${url.port || '5432'}`);
      console.log(`User: ${url.username}`);
      dbName = url.pathname.slice(1);
      console.log(`Database: ${dbName}`);
    } else {
      console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`Port: ${process.env.DB_PORT || '5432'}`);
      console.log(`User: ${process.env.DB_USER || 'postgres'}`);
      dbName = process.env.DB_NAME || 'myappdb';
      console.log(`Database: ${dbName}`);
    }
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].now);
    
    // Check if database exists (dbName already set above)
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`\n⚠️  Database "${dbName}" does not exist. Creating it...`);
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`\n✅ Database "${dbName}" already exists.`);
    }
    
    await pool.end();
    console.log('\n✅ All checks passed! You can now start the server.');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Credentials in .env file are correct');
    console.error('3. Database user has proper permissions');
    process.exit(1);
  }
}

testConnection();

