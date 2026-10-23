module.exports = {
  Home: {
    sections: [
      { type: 'Hero', layout: 'hero-image-right', components: ['Heading', 'Paragraph', 'PrimaryButton', 'HeroImage'] },
      { type: 'FeaturedDishes', layout: 'cards', components: ['SectionHeading', 'DishCards'] },
      { type: 'Testimonials', layout: 'carousel', components: ['SectionHeading', 'QuoteCards'] },
      { type: 'CTA', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  Menu: {
    sections: [
      { type: 'MenuHero', layout: 'centered', components: ['Heading', 'Paragraph'] },
      { type: 'MenuGrid', layout: 'cards', components: ['CategoryTabs', 'DishCards'] },
      { type: 'Specials', layout: 'banner', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  About: {
    sections: [
      { type: 'Story', layout: 'image-left', components: ['Heading', 'Paragraph', 'TeamImage'] },
      { type: 'Team', layout: 'grid', components: ['SectionHeading', 'TeamCards'] },
      { type: 'Gallery', layout: 'masonry', components: ['SectionHeading', 'ImageGrid'] }
    ]
  },
  Reservations: {
    sections: [
      { type: 'BookingForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'Hours', layout: 'two-column', components: ['Heading', 'HoursTable'] },
      { type: 'Location', layout: 'map-below', components: ['Heading', 'Paragraph', 'MapEmbed'] }
    ]
  },
  Contact: {
    sections: [
      { type: 'ContactForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'Map', layout: 'full-width', components: ['MapEmbed'] },
      { type: 'SocialLinks', layout: 'centered', components: ['Heading', 'SocialIcons'] }
    ]
  }
};
