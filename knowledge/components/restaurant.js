module.exports = {
  Hero: [
    { type: 'heading', content: 'Welcome to {{business}}', properties: { level: 1 } },
    { type: 'paragraph', content: 'Experience the finest dining with us.', tones: {
      luxury: 'An unforgettable fine-dining experience, crafted for the discerning palate.',
      playful: 'Come hungry, leave happy — great food and good times, every single day.',
      minimalist: 'Good food, simply prepared.',
      rustic: 'Hearty meals made the old-fashioned way, from our kitchen to your table.',
      professional: 'Exceptional cuisine and service for business dining and special occasions.'
    } },
    { type: 'button', label: 'Reserve a Table', properties: { variant: 'primary' } },
    { type: 'image', asset: 'hero-image', properties: { aspect: '16:9' } }
  ],

  FeaturedDishes: [
    { type: 'heading', content: 'Featured Dishes', properties: { level: 2 } },
    { type: 'cards', content: '', properties: { source: 'featured-dishes', layout: 'grid' } }
  ],

  Testimonials: [
    { type: 'heading', content: 'What Our Guests Say', properties: { level: 2 } },
    { type: 'cards', content: '', properties: { source: 'testimonials', layout: 'carousel' } }
  ],

  CTA: [
    { type: 'heading', content: 'Ready to Dine?', properties: { level: 2 }, tones: {
      luxury: 'Reserve Your Evening',
      playful: "Hungry? Let's Fix That.",
      minimalist: 'Visit Us'
    } },
    { type: 'paragraph', content: 'Book your table today and enjoy an unforgettable experience.', tones: {
      luxury: 'Reserve your table for an evening of refined dining.',
      playful: 'Grab a table — the good stuff goes fast.',
      minimalist: 'Book a table.',
      rustic: "Save your seat — there's always room at our table."
    } },
    { type: 'button', label: 'Book Now', properties: { variant: 'primary' } }
  ],

  MenuHero: [
    { type: 'heading', content: 'Our Menu', properties: { level: 1 } },
    { type: 'paragraph', content: 'Explore our carefully crafted dishes.' }
  ],

  MenuGrid: [
    { type: 'tabs', content: '', properties: { items: ['Appetizers', 'Mains', 'Desserts'] } },
    { type: 'cards', content: '', properties: { source: 'menu-items', layout: 'grid' } }
  ],

  Specials: [
    { type: 'heading', content: "Today's Specials", properties: { level: 2 } },
    { type: 'paragraph', content: 'Discover our chef\'s daily recommendations.' },
    { type: 'button', label: 'View Full Menu', properties: { variant: 'secondary' } }
  ],

  Story: [
    { type: 'heading', content: 'Our Story', properties: { level: 2 } },
    { type: 'paragraph', content: 'A tale of passion, flavor, and tradition.' },
    { type: 'image', asset: 'story-image', properties: { aspect: '4:3' } }
  ],

  Team: [
    { type: 'heading', content: 'Meet the Team', properties: { level: 2 } },
    { type: 'cards', content: '', properties: { source: 'team-members', layout: 'grid' } }
  ],

  Gallery: [
    { type: 'heading', content: 'Gallery', properties: { level: 2 } },
    { type: 'gallery', content: '', properties: { source: 'gallery-images', layout: 'masonry' } }
  ],

  BookingForm: [
    { type: 'heading', content: 'Make a Reservation', properties: { level: 2 } },
    { type: 'paragraph', content: 'Reserve your table in just a few clicks.' },
    { type: 'form', content: '', properties: { fields: ['name', 'email', 'date', 'guests'] } },
    { type: 'button', label: 'Confirm Reservation', properties: { variant: 'primary' } }
  ],

  Hours: [
    { type: 'heading', content: 'Opening Hours', properties: { level: 2 } },
    { type: 'table', content: '', properties: { rows: ['Mon-Fri', 'Sat-Sun'] } }
  ],

  Location: [
    { type: 'heading', content: 'Find Us', properties: { level: 2 } },
    { type: 'paragraph', content: 'We are located in the heart of the city.' },
    { type: 'map', asset: 'location-map', properties: { zoom: 15 } }
  ],

  ContactForm: [
    { type: 'heading', content: 'Get in Touch', properties: { level: 2 } },
    { type: 'paragraph', content: 'We would love to hear from you.' },
    { type: 'form', content: '', properties: { fields: ['name', 'email', 'message'] } },
    { type: 'button', label: 'Send Message', properties: { variant: 'primary' } }
  ],

  Map: [
    { type: 'map', asset: 'location-map', properties: { zoom: 15 } }
  ],

  SocialLinks: [
    { type: 'heading', content: 'Follow Us', properties: { level: 2 } },
    { type: 'icons', content: '', properties: { platforms: ['instagram', 'facebook', 'twitter'] } }
  ]
};
