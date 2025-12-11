import cron from 'node-cron';
import { config } from './config/config';
import { fullSyncWorkflow } from './workflows/fullSync';
import { incrementalSyncWorkflow } from './workflows/incrementalSync';
import { supabaseService } from './services/supabase.service';
import { logger } from './utils/logger';

/**
 * Main application entry point
 * Orchestrates full sync on startup and incremental sync on schedule
 */
async function main(): Promise<void> {
  logger.info('🚀 Starting Dutch Festival Scraper System...');

  try {
    // Check if this is first run (no processed events)
    const processedEvents = await supabaseService.getProcessedEvents();
    const isFirstRun = processedEvents.size === 0;

    if (isFirstRun) {
      logger.info('📊 First run detected - performing FULL SYNC...');
      await fullSyncWorkflow.initialize();
      const result = await fullSyncWorkflow.execute();
      logger.info(`✅ Full sync complete: ${result.saved} events saved`);
    } else {
      logger.info(
        `📋 Found ${processedEvents.size} previously processed events`
      );
      logger.info('Running initial INCREMENTAL SYNC...');
      const result = await incrementalSyncWorkflow.execute();
      logger.info(`✅ Incremental sync complete: ${result.sent} events sent`);
    }

    // Schedule incremental sync
    // Using 1 minute for testing (change to 2 or more hours in production)
    const syncIntervalMinutes = 1; // TEST: 1 minute
    const cronExpression = `*/${syncIntervalMinutes} * * * *`; // Every N minutes

    logger.info(`⏱️  Scheduling incremental sync every ${syncIntervalMinutes} minute(s)`);
    cron.schedule(cronExpression, async () => {
      logger.info('🔄 Cron trigger: Running incremental sync...');
      try {
        const result = await incrementalSyncWorkflow.execute();
        logger.info(
          `✅ Scheduled sync complete: ${result.sent}/${result.newEvents} events sent`
        );
      } catch (error) {
        logger.error('Scheduled sync failed', error);
      }
    });

    logger.info('✅ System ready and waiting for scheduled tasks...');

  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  logger.error('Fatal error', error);
  process.exit(1);
});
