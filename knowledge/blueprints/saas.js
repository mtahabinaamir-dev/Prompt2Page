module.exports = {
  Home: {
    sections: [
      { type: 'Hero', layout: 'hero-image-right', components: ['Heading', 'Paragraph', 'PrimaryButton', 'HeroImage'] },
      { type: 'FeaturesPreview', layout: 'cards', components: ['SectionHeading', 'FeatureCards'] },
      { type: 'SocialProof', layout: 'carousel', components: ['SectionHeading', 'LogoStrip', 'TestimonialCards'] },
      { type: 'CTA', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  Features: {
    sections: [
      { type: 'FeatureGrid', layout: 'cards', components: ['Heading', 'FeatureCards'] },
      { type: 'Integrations', layout: 'logo-grid', components: ['SectionHeading', 'IntegrationLogos'] },
      { type: 'UseCases', layout: 'tabs', components: ['SectionHeading', 'TabPanels'] }
    ]
  },
  Pricing: {
    sections: [
      { type: 'PricingTable', layout: 'cards', components: ['Heading', 'PricingCards'] },
      { type: 'Comparison', layout: 'table', components: ['SectionHeading', 'ComparisonTable'] },
      { type: 'FAQ', layout: 'accordion', components: ['SectionHeading', 'AccordionItems'] }
    ]
  },
  About: {
    sections: [
      { type: 'Story', layout: 'image-left', components: ['Heading', 'Paragraph', 'TeamImage'] },
      { type: 'Team', layout: 'grid', components: ['SectionHeading', 'TeamCards'] },
      { type: 'Values', layout: 'cards', components: ['SectionHeading', 'ValueCards'] }
    ]
  },
  Contact: {
    sections: [
      { type: 'ContactForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'Support', layout: 'two-column', components: ['Heading', 'SupportChannels'] },
      { type: 'DemoRequest', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  }
};
