import { Worker, Job } from 'bullmq';
import { PrismaClient, ActorType } from '@prisma/client';
import { redisClient } from '../config/redis';
import { QUEUE_NAMES } from '../services/queue.service';
import { resolveWardFromGPS } from '../utils/gis';
import { assignCorporationWithAI } from '../utils/gemini';

const prisma = new PrismaClient();

// OpenStreetMap Nominatim is a completely free API for Reverse Geocoding
// We pull the URL from our .env file!
const NOMINATIM_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/reverse';

/**
 * Step 6.3: The GIS Worker
 * This background process listens to the GIS_ROUTE queue. 
 * It determines two things:
 * 1. The exact Ward the user is standing in (via PostGIS)
 * 2. The human-readable street address (via OpenStreetMap)
 */
export const gisWorker = new Worker(
  QUEUE_NAMES.GIS_ROUTE,
  async (job: Job) => {
    // Extract the GPS data passed from the Issue Controller (Step 3.2)
    const { issueId, latitude, longitude } = job.data as { issueId: string, latitude: number, longitude: number };
    
    console.log(`🗺️ [GISWorker] Routing Issue ${issueId} at [${latitude}, ${longitude}]...`);

    try {
      // 1. Resolve the Ward using our lightning-fast PostGIS utility (Step 6.2)
      const wardId = await resolveWardFromGPS(latitude, longitude);
      
      let address = 'Unknown Location';
      let corporationId: string | null = null;
      try {
        // We MUST pass a custom User-Agent, otherwise the free Nominatim API blocks the request
        const response = await fetch(`${NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: {
            'User-Agent': 'CommunityHero-Backend/1.0 (test@communityhero.com)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // They return incredibly detailed addresses like:
          // "5th Avenue, Downtown, Delhi, 110001, India"
          address = data.display_name || 'Unknown Location';

          // AI Assignment: Use Gemini to match address to Corporation
          const allCorps = await prisma.corporation.findMany({ select: { id: true, name: true } });
          corporationId = await assignCorporationWithAI(address, allCorps);
        }
      } catch (geocodeError) {
        console.warn(`⚠️ [GISWorker] Failed to reverse geocode address. Skipping address lookup.`);
        // Note: We do NOT throw here! If the free Maps API goes down, 
        // we still want to save the Ward so the government can fix the pothole!
      }

      // 3. Update the Issue in PostgreSQL
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          wardId: wardId,
          corporationId: corporationId,
          addressResolved: address,
        }
      });

      // 4. Log this action in our immutable event ledger
      await prisma.issueEvent.create({
        data: {
          issueId: issueId,
          eventType: 'ROUTING_COMPLETED',
          actorType: ActorType.SYSTEM, // The system handled the routing
          newValue: {
            wardAssigned: wardId ? true : false,
            address: address
          }
        }
      });

      if (corporationId) {
        console.log(`✅ [GISWorker] Issue ${issueId} assigned to Corporation: ${corporationId} | Address: ${address}`);
      } else {
        console.log(`⚠️ [GISWorker] Issue ${issueId} could not be matched to a Corporation | Address: ${address}`);
      }
      
    } catch (error) {
      console.error(`❌ [GISWorker] Failed to route Issue: ${issueId}`, error);
      throw error; // Triggers BullMQ retry logic
    }
  },
  {
    connection: redisClient as any,
    concurrency: 5 // We can process 5 concurrent GIS lookups since PostGIS is heavily optimized!
  }
);

gisWorker.on('error', (err) => {
  console.error('🚨 [GISWorker] Critical System Error:', err);
});
