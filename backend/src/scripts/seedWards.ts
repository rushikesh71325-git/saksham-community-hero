import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Step 6.1: Seed Wards (Raw SQL)
 * This script manually injects the PostGIS geometry column into our Prisma database
 * and seeds two sample Wards using WKT (Well-Known Text) polygons.
 */
async function main() {
  console.log('🌍 Seeding Spatial Wards into PostgreSQL...');

  try {
    // 1. Add the PostGIS geometry column to our Ward table via Raw SQL.
    // We use SRID 4326, which is the standard GPS coordinate system (WGS 84).
    console.log('Adding geom column to Ward table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);
    `);

    // 2. Clear existing wards to avoid duplicates during testing
    await prisma.ward.deleteMany();

    // 3. Insert Ward A (Downtown)
    // We define the boundary of the ward using GPS coordinates. 
    // Think of this like drawing a box on Google Maps!
    const wardA_Id = crypto.randomUUID();
    const wardA_WKT = `POLYGON((77.1000 28.7000, 77.1100 28.7000, 77.1100 28.7100, 77.1000 28.7100, 77.1000 28.7000))`;
    
    console.log('Inserting Ward A (Downtown)...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Ward" (id, "wardCode", "wardName", city, zone, "areaSqkm", population, "performanceScore", geom)
      VALUES (
        '${wardA_Id}',
        'W-A',
        'Downtown Ward',
        'Delhi',
        'Central',
        10.5,
        50000,
        100,
        ST_SetSRID(ST_GeomFromText('${wardA_WKT}'), 4326)
      )
    `);

    // 4. Insert Ward B (Uptown) right next to it
    const wardB_Id = crypto.randomUUID();
    const wardB_WKT = `POLYGON((77.1100 28.7000, 77.1200 28.7000, 77.1200 28.7100, 77.1100 28.7100, 77.1100 28.7000))`;

    console.log('Inserting Ward B (Uptown)...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Ward" (id, "wardCode", "wardName", city, zone, "areaSqkm", population, "performanceScore", geom)
      VALUES (
        '${wardB_Id}',
        'W-B',
        'Uptown Ward',
        'Delhi',
        'North',
        12.2,
        65000,
        100,
        ST_SetSRID(ST_GeomFromText('${wardB_WKT}'), 4326)
      )
    `);

    // 5. Create a spatial index!
    // Without this, the database checks every single ward one by one (slow!).
    // A GIST index allows Postgres to instantly find the ward using an R-Tree algorithm.
    console.log('Creating GIST Spatial Index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS ward_geom_idx ON "Ward" USING GIST (geom);
    `);

    console.log('✅ Wards seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed Wards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
