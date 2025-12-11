import { normalizeEvent } from './src/utils/normalize';
import { extractContactFromMultipleSources } from './src/utils/contact-extractor';

console.log('=== Testing Event Normalization ===\n');

// Test 1: Event with all fields
console.log('Test 1: Event with all fields');
const event1 = normalizeEvent({
  name: 'Test Festival',
  date: '2024-06-15',
  location: 'Amsterdam',
  source: 'TestSource',
  organizer: 'Amsterdam Events',
  contact: '+31 20 123 4567',
}, 'https://example.com');
console.log(event1);
console.log('✓ All fields present\n');

// Test 2: Event with missing location (but has venue)
console.log('Test 2: Event with venue instead of location');
const event2 = normalizeEvent({
  name: 'Festival Without Location',
  date: '2024-07-20',
  location: '',
  source: 'TestSource',
  venue: 'Paradiso Amsterdam',
  organizer: 'Some Organizer',
}, 'https://example.com');
console.log(event2);
console.log('Location is:', event2.locatie_evenement, '(should be "Paradiso Amsterdam")\n');

// Test 3: Event with missing location and venue (should fallback to "onbekend")
console.log('Test 3: Event with missing location and venue (should use "onbekend")');
const event3 = normalizeEvent({
  name: 'Festival Without Location',
  date: '2024-07-20',
  location: '',
  source: 'TestSource',
}, 'https://example.com');
console.log(event3);
console.log('Location is:', event3.locatie_evenement, '(should be "onbekend")\n');

// Test 4: Event with missing organizer
console.log('Test 4: Event with missing organizer (should use "onbekend")');
const event4 = normalizeEvent({
  name: 'Festival Without Organizer',
  date: '2024-08-10',
  location: 'Rotterdam',
  source: 'TestSource',
}, 'https://example.com');
console.log(event4);
console.log('Organizer is:', event4.organisateur, '(should be "onbekend")');

// Test 5: Event with missing contact
console.log('Test 5: Event with missing contact (should use "onbekend")');
const event5 = normalizeEvent({
  name: 'Festival Without Contact',
  date: '2024-09-05',
  location: 'Utrecht',
  source: 'TestSource',
  organizer: 'Utrecht Events',
}, 'https://example.com');
console.log(event5);
console.log('Contact is:', event5.contact_organisator, '(should be "onbekend")\n');

// Test 6: All optional fields missing
console.log('Test 6: All optional fields missing (should all be "onbekend")');
const event6 = normalizeEvent({
  name: 'Minimal Festival',
  date: '2024-10-01',
  location: '',
  source: 'TestSource',
}, 'https://example.com');
console.log(event6);
console.log('Organizer:', event6.organisateur);
console.log('Location:', event6.locatie_evenement);
console.log('Contact:', event6.contact_organisator);
console.log('(all should be "onbekend")');

// Test 6: Contact extraction from multiple sources
console.log('Test 6: Contact extraction from multiple sources');
const contact1 = extractContactFromMultipleSources(
  'Some text with info@example.com in it',
  undefined,
  'Another source'
);
console.log('Extracted contact:', contact1);

const contact2 = extractContactFromMultipleSources(
  undefined,
  undefined,
  'No contact info here'
);
console.log('No contact found:', contact2, '(should be "onbekend")');

console.log('\n=== All Tests Complete ===');
