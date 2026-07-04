require('dotenv').config();
const { Client } = require('pg');

async function run() {
  console.log("Migration Starting...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error("MIGRATION ERROR: DATABASE_URL is missing or contains placeholder '[YOUR-PASSWORD]'.");
    console.log("Please update your .env file with your actual database password first.");
    process.exit(1);
  }

  console.log("Connecting to Supabase database...");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Successfully connected to the database.");

    console.log("Creating tables from scratch...");

    // Create cafes table
    const createCafesTable = `
      CREATE TABLE IF NOT EXISTS cafes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo_url TEXT,
        hero_image TEXT,
        primary_color VARCHAR(50),
        accent_color VARCHAR(50),
        bg_color VARCHAR(50),
        custom_domain VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createCafesTable);
    console.log("✓ Table 'cafes' created (or already exists).");

    // Create categories table
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createCategoriesTable);
    console.log("✓ Table 'categories' created (or already exists).");

    // Create products table
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createProductsTable);
    console.log("✓ Table 'products' created (or already exists).");

    console.log("MIGRATION SUCCESS: All database tables are fully configured!");
  } catch (err) {
    console.error("MIGRATION FAILED:", err.message);
  } finally {
    await client.end();
  }
}

run();
