import { supabaseService } from './src/services/supabase.service';
import { logger } from './src/utils/logger';

/**
 * Quick verification: Check how many events are in the database
 */
async function verifyDatabase(): Promise<void> {
  logger.info('🔍 Verifying database...');

  try {
    const processed = await supabaseService.getProcessedEvents();
    logger.info(`📊 Events in processed_events table: ${processed.size}`);
    logger.info('✅ Database connection working');
    process.exit(0);
  } catch (error) {
    logger.error('Database verification failed', error);
    process.exit(1);
  }
}

verifyDatabase();
