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
        "coverImage" TEXT DEFAULT 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1920&auto=format&fit=crop',
        primary_color VARCHAR(50),
        accent_color VARCHAR(50),
        bg_color VARCHAR(50),
        custom_domain VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createCafesTable);
    console.log("✓ Table 'cafes' created (or already exists).");

    // Ensure all optional columns exist in cafes table in case it already existed
    try {
      await client.query(`
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "coverImage" TEXT DEFAULT 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1920&auto=format&fit=crop';
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS working_hours TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS maps_url TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS instagram_url TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS phone_number TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_english BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_spanish BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_arabic BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "isFrenchActive" BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_french BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "isPortugueseActive" BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_portuguese BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "isRussianActive" BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_russian BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "isGermanActive" BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_german BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS "isPersianActive" BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS has_persian BOOLEAN DEFAULT FALSE;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_en TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_es TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_ar TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_fr TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_pt TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_ru TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_de TEXT;
        ALTER TABLE cafes ADD COLUMN IF NOT EXISTS campaign_text_fa TEXT;
      `);
      console.log("✓ Cafe columns verified / added.");
    } catch (columnErr) {
      console.warn("Columns check failed:", columnErr.message);
    }

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

    // Ensure multi-language columns exist on products and categories
    try {
      await client.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_es VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_es TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_fr TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_pt VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_pt TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ru TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_de VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_de TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_fa VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_fa TEXT;

        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_es VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_fr VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_pt VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_de VARCHAR(255);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_fa VARCHAR(255);
      `);
      console.log("✓ Multi-language columns verified on products and categories.");
    } catch (langColErr) {
      console.warn("Language columns check failed:", langColErr.message);
    }

    console.log("MIGRATION SUCCESS: All database tables are fully configured!");
  } catch (err) {
    console.error("MIGRATION FAILED:", err.message);
  } finally {
    await client.end();
  }
}

run();
