import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Step 6.2: GIS Utility
 * This function takes a raw GPS coordinate (latitude, longitude) from a citizen's phone
 * and uses PostGIS spatial math to calculate exactly which Ward polygon that point falls inside.
 */
export const resolveWardFromGPS = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    // 1. We construct a raw SQL query using PostGIS functions.
    // ST_MakePoint(lon, lat) creates a geographic point in space.
    // ST_Contains(geom, point) mathematically checks if the point is inside the Ward's boundaries.
    
    // IMPORTANT: PostGIS ALWAYS uses (Longitude, Latitude) order, just like (X, Y) on a graph! 
    // Mixing this up is the #1 cause of GIS bugs.
    const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
      SELECT id 
      FROM "Ward"
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      LIMIT 1;
    `);

    // 2. If the spatial math finds a match, we return the UUID of that Ward
    if (result && result.length > 0) {
      return result[0].id;
    }

    // 3. If the citizen is reporting an issue outside the city limits, it returns null
    return null;
  } catch (error) {
    console.error('GIS Ward Resolution failed:', error);
    throw new Error('Failed to resolve Ward from GPS coordinates');
  }
};
