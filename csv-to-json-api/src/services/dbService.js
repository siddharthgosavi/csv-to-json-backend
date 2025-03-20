const { Pool } = require("pg");
const fs = require("fs");
const config = require("../config/config");
const poolConfig = {
  ...config.db,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca.pem").toString(),
  },
};
const pool = new Pool(poolConfig);

/**
 * Save parsed data to database
 * @param {Array} data - Array of JSON objects
 * @returns {Promise<void>}
 */
async function saveToDatabase(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of data) {
      const name = `${item.name.firstName} ${item.name.lastName}`;
      const age = parseInt(item.age);

      // Extract address fields
      const address = {};
      for (const key in item) {
        if (key === "address") {
          Object.assign(address, item[key]);
        }
      }

      // Extract additional info (all fields except name, age, and address)
      const additionalInfo = {};
      for (const key in item) {
        if (key !== "name" && key !== "age" && key !== "address") {
          additionalInfo[key] = item[key];
        }
      }

      // Insert into database
      await client.query(
        `INSERT INTO users (name, age, address, additional_info) 
         VALUES ($1, $2, $3, $4)`,
        [name, age, JSON.stringify(address), JSON.stringify(additionalInfo)]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Calculate age distribution
 * @returns {Promise<Object>} - Age distribution statistics
 */
async function calculateAgeDistribution() {
  const client = await pool.connect();

  try {
    const totalResult = await client.query(
      "SELECT COUNT(*) as total FROM users"
    );
    const total = parseInt(totalResult.rows[0].total);

    const ageGroups = [
      {
        name: "< 20",
        query: "SELECT COUNT(*) as count FROM users WHERE age < 20",
      },
      {
        name: "20 to 40",
        query:
          "SELECT COUNT(*) as count FROM users WHERE age >= 20 AND age <= 40",
      },
      {
        name: "40 to 60",
        query:
          "SELECT COUNT(*) as count FROM users WHERE age > 40 AND age <= 60",
      },
      {
        name: "> 60",
        query: "SELECT COUNT(*) as count FROM users WHERE age > 60",
      },
    ];

    const distribution = {};

    for (const group of ageGroups) {
      const result = await client.query(group.query);
      const count = parseInt(result.rows[0].count);
      const percentage = parseFloat(((count / total) * 100).toFixed(2));
      distribution[group.name] = percentage;
    }

    return distribution;
  } finally {
    client.release();
  }
}

/**
 * Initialize database by creating the users table if it doesn't exist
 */
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("Creating users table...");
      await client.query(`
        CREATE TABLE public.users (
          "name" varchar NOT NULL,
          age int4 NOT NULL,
          address jsonb NULL,
          additional_info jsonb NULL,
          id serial4 NOT NULL,
          PRIMARY KEY (id)
        );
      `);
      console.log("Users table created successfully");
    } else {
      console.log("Users table already exists");
    }
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  saveToDatabase,
  calculateAgeDistribution,
  initializeDatabase,
};
