import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { ProcessedEvent, FestivalEvent } from '../types/event.types';
import { logger } from '../utils/logger';

/**
 * Supabase service for database operations
 * Handles event storage and processed_events tracking for full/incremental sync
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
   * Get all processed event keys from database
   * Returns a Set for O(1) lookup performance
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
        data.forEach((row: any) => keys.add(row.sleutel));
      }

      logger.debug(`Loaded ${keys.size} processed event keys from database`);
      return keys;

    } catch (error) {
      logger.error('Failed to fetch processed events', error);
      return new Set<string>();
    }
  }

  /**
   * Check if event has been processed
   */
  async isEventProcessed(sleutel: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('processed_events')
        .select('sleutel')
        .eq('sleutel', sleutel)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      logger.debug(`Event not yet processed: ${sleutel}`);
      return false;
    }
  }

  /**
   * Save processed event key with timestamp
   */
  async saveProcessedEvent(sleutel: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      const { error } = await this.client
        .from('processed_events')
        .upsert(
          { sleutel, processed_at: now },
          { onConflict: 'sleutel' }
        );

      if (error) {
        throw error;
      }

      return true;

    } catch (error) {
      logger.error(`Failed to save processed event: ${sleutel}`, error);
      return false;
    }
  }

  /**
   * Save multiple processed events in batch with upsert
   */
  async saveProcessedEvents(sleutels: string[]): Promise<number> {
    try {
      const now = new Date().toISOString();
      const records = sleutels.map(sleutel => ({
        sleutel,
        processed_at: now,
      }));

      const { data, error } = await this.client
        .from('processed_events')
        .upsert(records, { onConflict: 'sleutel' })
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
   * Save festival event to database
   */
  async saveFestivalEvent(event: FestivalEvent): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('festival_events')
        .upsert(
          {
            sleutel: event.sleutel,
            datum_evenement: event.datum_evenement,
            evenement_naam: event.evenement_naam,
            locatie_evenement: event.locatie_evenement,
            organisateur: event.organisateur,
            contact_organisator: event.contact_organisator,
            bron: event.bron,
            duur_evenement: event.duur_evenement,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'sleutel' }
        );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logger.error(`Failed to save festival event: ${event.sleutel}`, error);
      return false;
    }
  }

  /**
   * Save multiple festival events in batch
   */
  async saveFestivalEvents(events: FestivalEvent[]): Promise<number> {
    try {
      const now = new Date().toISOString();
      const records = events.map(event => ({
        sleutel: event.sleutel,
        datum_evenement: event.datum_evenement,
        evenement_naam: event.evenement_naam,
        locatie_evenement: event.locatie_evenement,
        organisateur: event.organisateur,
        contact_organisator: event.contact_organisator,
        bron: event.bron,
        duur_evenement: event.duur_evenement,
        updated_at: now,
      }));

      const { data, error } = await this.client
        .from('festival_events')
        .upsert(records, { onConflict: 'sleutel' })
        .select();

      if (error) {
        throw error;
      }

      logger.info(`✓ Saved ${data?.length || 0} festival events to database`);
      return data?.length || 0;

    } catch (error) {
      logger.error('Failed to save festival events batch', error);
      return 0;
    }
  }

  /**
   * Clean up old processed events (older than X days)
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
      logger.info(`✓ Cleaned up ${deletedCount} old processed events`);
      return deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup old events', error);
      return 0;
    }
  }

  /**
   * Get events processed since a specific date (for incremental sync)
   */
  async getNewEventsSince(sinceDate: Date): Promise<Set<string>> {
    try {
      const { data, error } = await this.client
        .from('processed_events')
        .select('sleutel')
        .gte('processed_at', sinceDate.toISOString());

      if (error) {
        throw error;
      }

      const keys = new Set<string>();
      if (data) {
        data.forEach((row: any) => keys.add(row.sleutel));
      }

      logger.debug(`Found ${keys.size} events processed since ${sinceDate.toISOString()}`);
      return keys;

    } catch (error) {
      logger.error('Failed to fetch new events', error);
      return new Set<string>();
    }
  }

  /**
   * Clear all processed events (used for full sync reset)
   */
  async clearAllProcessedEvents(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('processed_events')
        .delete()
        .gt('processed_at', '1970-01-01'); // Delete all

      if (error) {
        throw error;
      }

      logger.info('✓ Cleared all processed events');
      return true;

    } catch (error) {
      logger.error('Failed to clear processed events', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
