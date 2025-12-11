import { fullSyncWorkflow } from './src/workflows/fullSync';
import { supabaseService } from './src/services/supabase.service';
import { logger } from './src/utils/logger';

/**
 * Test script: Run full sync once and exit
 */
async function testFullSync(): Promise<void> {
  logger.info('🚀 Starting Full Sync Test...');

  try {
    // Initialize full sync workflow
    await fullSyncWorkflow.initialize();
    logger.info('✓ Workflow initialized');

    // Execute full sync
    const result = await fullSyncWorkflow.execute();
    
    logger.info('📊 Full Sync Results:');
    logger.info(`   Total events found: ${result.totalEvents}`);
    logger.info(`   Events saved: ${result.saved}`);
    logger.info(`   Errors: ${result.errors}`);

    // Verify data in database
    const allEvents = await supabaseService.getProcessedEvents();
    logger.info(`✅ Database verification: ${allEvents.size} events now in database`);

    process.exit(0);
  } catch (error) {
    logger.error('Full sync test failed', error);
    process.exit(1);
  }
}

testFullSync();
