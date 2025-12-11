import { FestivalEvent } from '../types/event.types';

/**
 * Transform FestivalEvent from database format to client API format
 * Database uses Dutch field names (datum_evenement, organisateur)
 * Client API expects English field names (event_date, organisator)
 */
export function transformEventForClient(event: FestivalEvent): Record<string, any> {
  return {
    event_date: event.datum_evenement,
    evenement_naam: event.evenement_naam,
    locatie_evenement: event.locatie_evenement,
    organisator: event.organisateur,
    contact_organisator: event.contact_organisator,
    bron: event.bron,
    duur_evenement: event.duur_evenement,
    sleutel: event.sleutel,
  };
}

export default {
  transformEventForClient,
};
