/**
 * Business-type synonyms. The canonical key becomes entities.business,
 * which selects the blueprint used to generate the website.
 * Multi-word synonyms are matched first (longest-first in EntityExtractor).
 */
module.exports = {
  restaurant: [
    'restaurant',
    'pizzeria',
    'steakhouse',
    'sushi bar',
    'bistro',
    'eatery',
    'diner',
    'grill',
    'tavern',
  ],
  cafe: [
    'coffee shop',
    'cafe',
    'caffe',
  ],
  bakery: [
    'bakery',
    'bake shop',
    'patisserie',
    'bread shop',
  ],
  barber: [
    'barber shop',
    'barbershop',
    'barber',
    'hair salon',
    'salon',
    'hairdresser',
  ],
  gym: [
    'fitness center',
    'yoga studio',
    'gym',
    'fitness',
    'crossfit',
  ],
  agency: [
    'marketing agency',
    'design agency',
    'creative agency',
    'agency',
  ],
  saas: [
    'tech startup',
    'startup',
    'saas',
    'software',
    'app',
  ],
  dentist: [
    'dental clinic',
    'orthodontist',
    'dentist',
    'dental',
  ],
  portfolio: [
    'portfolio',
    'showcase',
  ],
  store: [
    'boutique',
    'outlet',
    'market',
    'store',
    'shop',
  ],
};
