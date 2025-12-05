import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { ProcessedEvent } from '../types/event.types';
import { logger } from '../utils/logger';

/**
 * Supabase service for database operations
 */
class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceKey
    );
  }

  /**
   * Get all processed event keys
   */
  async getProcessedEvents(): Promise<Set<string>> {
    try {
      const { data, error } = await this.client
        .from('processed_events')
        .select('sleutel');

      if (error) {
        throw error;
      }

      const keys = new Set<string>();
      if (data) {
        data.forEach((row) => keys.add(row.sleutel));
      }

      logger.debug(`Loaded ${keys.size} processed event keys from database`);
      return keys;

    } catch (error) {
      logger.error('Failed to fetch processed events', error);
      return new Set<string>();
    }
  }

  /**
   * Save processed event key
   */
  async saveProcessedEvent(sleutel: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('processed_events')
        .insert({ sleutel });

      if (error) {
        // Ignore duplicate key errors
        if (error.code === '23505') {
          return true;
        }
        throw error;
      }

      return true;

    } catch (error) {
      logger.error(`Failed to save processed event: ${sleutel}`, error);
      return false;
    }
  }

  /**
   * Save multiple processed events in batch
   */
  async saveProcessedEvents(sleutels: string[]): Promise<number> {
    try {
      const records = sleutels.map(sleutel => ({ sleutel }));

      const { data, error } = await this.client
        .from('processed_events')
        .insert(records)
        .select();

      if (error) {
        throw error;
      }

      return data?.length || 0;

    } catch (error) {
      logger.error('Failed to save processed events batch', error);
      return 0;
    }
  }

  /**
   * Clear old processed events (older than X days)
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.client
        .from('processed_events')
        .delete()
        .lt('processed_at', cutoffDate.toISOString())
        .select();

      if (error) {
        throw error;
      }

      const deletedCount = data?.length || 0;
      logger.info(`Cleaned up ${deletedCount} old processed events`);
      return deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup old events', error);
      return 0;
    }
  }
}

export const supabaseService = new SupabaseService();