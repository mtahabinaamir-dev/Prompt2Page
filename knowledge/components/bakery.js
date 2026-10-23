/**
 * Bakery component templates — real copy, no placeholders.
 * {{business}} is substituted with the project name at generation time.
 */
module.exports = {
  Hero: [
    { type: 'heading', content: 'Baked Fresh Every Morning', properties: { level: 1 }, tones: {
      playful: 'Fresh Bakes, Happy Faces',
      minimalist: 'Fresh Daily',
      rustic: 'Baked Like Grandma Used To'
    } },
    { type: 'paragraph', content: '{{business}} — artisan breads, cakes and pastries made from scratch, every single day.' },
    { type: 'button', label: 'See Today\'s Menu', properties: { variant: 'primary' } },
    { type: 'image', asset: 'hero-image', properties: { aspect: '16:9' } }
  ],

  FeaturedProducts: [
    { type: 'heading', content: 'Fresh From The Oven', properties: { level: 2 } },
    { type: 'paragraph', content: 'Sourdough, croissants, custom cakes — baked in small batches through the day.' }
  ],

  Testimonials: [
    { type: 'heading', content: 'What Our Customers Say', properties: { level: 2 } },
    { type: 'paragraph', content: '"The best croissants in town. I come here every Saturday morning." — a happy regular' }
  ],

  CTA: [
    { type: 'heading', content: 'Craving Something Sweet?', properties: { level: 2 }, tones: {
      playful: 'Sweet Tooth? We Got You.',
      minimalist: 'Order Ahead',
      rustic: 'Something Sweet From the Oven'
    } },
    { type: 'paragraph', content: 'Order ahead for pickup, or ask about custom cakes for your next celebration.', tones: {
      playful: 'Order ahead, skip the line — cake emergencies welcome.',
      minimalist: 'Order for pickup.',
      rustic: 'Call ahead and we will set aside something warm for you.'
    } },
    { type: 'button', label: 'Order Ahead', properties: { variant: 'primary' } }
  ],

  ProductGrid: [
    { type: 'heading', content: 'Our Bakes', properties: { level: 2 } },
    { type: 'paragraph', content: 'Breads, viennoiserie, cakes and seasonal specials.' }
  ],

  Categories: [
    { type: 'heading', content: 'Browse By Craving', properties: { level: 2 } },
    { type: 'paragraph', content: 'Breads • Pastries • Cakes • Seasonal' }
  ],

  Specials: [
    { type: 'heading', content: 'This Week\'s Specials', properties: { level: 2 } },
    { type: 'paragraph', content: 'Ask in store about our rotating seasonal bakes — they sell out fast.' },
    { type: 'button', label: 'See Specials', properties: { variant: 'secondary' } }
  ],

  Story: [
    { type: 'heading', content: 'Our Story', properties: { level: 2 } },
    { type: 'paragraph', content: '{{business}} started with one oven and a family sourdough starter. Everything is still mixed, shaped and baked by hand.' },
    { type: 'image', asset: 'story-image', properties: { aspect: '4:3' } }
  ],

  Team: [
    { type: 'heading', content: 'The Bakers', properties: { level: 2 } },
    { type: 'paragraph', content: 'A small team obsessed with crumb, crust and flavor.' }
  ],

  Gallery: [
    { type: 'heading', content: 'From Our Ovens', properties: { level: 2 } },
    { type: 'paragraph', content: 'A look at what came out of the oven this week.' }
  ],

  ContactForm: [
    { type: 'heading', content: 'Get In Touch', properties: { level: 2 } },
    { type: 'paragraph', content: 'Custom cake orders, wholesale enquiries, or just to say hi.' },
    { type: 'button', label: 'Send Message', properties: { variant: 'primary' } }
  ],

  Hours: [
    { type: 'heading', content: 'Opening Hours', properties: { level: 2 } },
    { type: 'paragraph', content: 'Monday – Saturday: 7am – 6pm • Sunday: 8am – 2pm' }
  ],

  Location: [
    { type: 'heading', content: 'Find Us', properties: { level: 2 } },
    { type: 'paragraph', content: 'Come by for the smell alone — stay for the sourdough.' }
  ]
};
