module.exports = {
  Home: {
    sections: [
      { type: 'Hero', layout: 'hero-image-right', components: ['Heading', 'Paragraph', 'PrimaryButton', 'HeroImage'] },
      { type: 'FeaturedProducts', layout: 'cards', components: ['SectionHeading', 'ProductCards'] },
      { type: 'Testimonials', layout: 'carousel', components: ['SectionHeading', 'QuoteCards'] },
      { type: 'CTA', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  Products: {
    sections: [
      { type: 'ProductGrid', layout: 'cards', components: ['Heading', 'CategoryFilters', 'ProductCards'] },
      { type: 'Categories', layout: 'grid', components: ['SectionHeading', 'CategoryCards'] },
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
  Contact: {
    sections: [
      { type: 'ContactForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'Hours', layout: 'two-column', components: ['Heading', 'HoursTable'] },
      { type: 'Location', layout: 'map-below', components: ['Heading', 'Paragraph', 'MapEmbed'] }
    ]
  }
};
