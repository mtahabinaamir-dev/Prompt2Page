module.exports = {
  Hero: [
    { type: 'heading', content: 'Welcome to {{business}}', properties: { level: 1 } },
    { type: 'paragraph', content: 'Quality you can trust, service you will remember.', tones: {
      luxury: 'Uncompromising quality, quietly delivered.',
      playful: 'Good stuff, zero fuss — you will love working with us.',
      minimalist: 'Well made. Honestly priced.',
      professional: 'Trusted expertise for teams that need results.'
    } },
    { type: 'button', label: 'Learn More', properties: { variant: 'primary' } },
    { type: 'image', asset: 'hero-image', properties: { aspect: '16:9' } }
  ],

  Features: [
    { type: 'heading', content: 'Features', properties: { level: 2 } },
    { type: 'cards', content: '', properties: { source: 'features', layout: 'grid' } }
  ],

  CTA: [
    { type: 'heading', content: 'Ready When You Are', properties: { level: 2 }, tones: {
      luxury: 'Begin the Conversation',
      playful: "Let's Do This",
      minimalist: 'Contact'
    } },
    { type: 'paragraph', content: 'Get in touch today — we would love to hear from you.', tones: {
      luxury: 'We welcome your inquiry.',
      playful: 'Say hi — we do not bite.',
      minimalist: 'Get in touch.',
      professional: 'Contact us to discuss your project.'
    } },
    { type: 'button', label: 'Contact Us', properties: { variant: 'primary' } }
  ],

  Story: [
    { type: 'heading', content: 'Our Story', properties: { level: 2 } },
    { type: 'paragraph', content: 'We care about doing good work and treating people right.' },
    { type: 'image', asset: 'story-image', properties: { aspect: '4:3' } }
  ],

  Team: [
    { type: 'heading', content: 'Our Team', properties: { level: 2 } },
    { type: 'cards', content: '', properties: { source: 'team-members', layout: 'grid' } }
  ],

  ContactForm: [
    { type: 'heading', content: 'Contact Us', properties: { level: 2 } },
    { type: 'paragraph', content: 'Questions, feedback, or just saying hello — we reply fast.' },
    { type: 'form', content: '', properties: { fields: ['name', 'email', 'message'] } },
    { type: 'button', label: 'Send Message', properties: { variant: 'primary' } }
  ]
};
