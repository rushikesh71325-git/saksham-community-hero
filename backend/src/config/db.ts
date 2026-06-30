import { Pool } from 'pg';
import { config } from './index';

// Create a new PostgreSQL connection pool for raw spatial queries
export const pool = new Pool({
  connectionString: config.db.url,
});

/**
 * Verifies the database connection and ensures PostGIS is installed.
 * This mirrors the GIS Router initialization in MeraWard.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');

    try {
      // Check if PostGIS extension is enabled
      const res = await client.query('SELECT postgis_version();');
      console.log(`🌍 PostGIS verified: ${res.rows[0].postgis_version}`);
    } catch (postgisError) {
      console.error('❌ PostGIS extension is missing!');
      console.error('Please run: CREATE EXTENSION postgis; in your database.');
      process.exit(1);
    }

    client.release();
  } catch (error) {
    console.error('❌ Database connection failed. Please check DATABASE_URL in .env');
    console.error(error);
    process.exit(1);
  }
};
