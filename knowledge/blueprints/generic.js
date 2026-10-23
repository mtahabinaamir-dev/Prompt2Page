module.exports = {
  Home: {
    sections: [
      { type: 'Hero', layout: 'hero-image-right', components: ['Heading', 'Paragraph', 'PrimaryButton', 'HeroImage'] },
      { type: 'Features', layout: 'cards', components: ['SectionHeading', 'FeatureCards'] },
      { type: 'CTA', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  About: {
    sections: [
      { type: 'Story', layout: 'image-left', components: ['Heading', 'Paragraph', 'TeamImage'] },
      { type: 'Team', layout: 'grid', components: ['SectionHeading', 'TeamCards'] }
    ]
  },
  Contact: {
    sections: [
      { type: 'ContactForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'Location', layout: 'map-below', components: ['Heading', 'Paragraph', 'MapEmbed'] }
    ]
  }
};
