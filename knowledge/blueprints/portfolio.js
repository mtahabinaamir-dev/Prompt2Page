module.exports = {
  Home: {
    sections: [
      { type: 'Hero', layout: 'hero-image-right', components: ['Heading', 'Paragraph', 'PrimaryButton', 'HeroImage'] },
      { type: 'FeaturedWork', layout: 'cards', components: ['SectionHeading', 'ProjectCards'] },
      { type: 'Skills', layout: 'grid', components: ['SectionHeading', 'SkillBars'] },
      { type: 'CTA', layout: 'centered', components: ['Heading', 'Paragraph', 'PrimaryButton'] }
    ]
  },
  Projects: {
    sections: [
      { type: 'ProjectGrid', layout: 'cards', components: ['Heading', 'ProjectCards'] },
      { type: 'CaseStudies', layout: 'alternating', components: ['SectionHeading', 'CaseStudyBlocks'] }
    ]
  },
  About: {
    sections: [
      { type: 'Bio', layout: 'image-left', components: ['Heading', 'Paragraph', 'ProfileImage'] },
      { type: 'Experience', layout: 'timeline', components: ['SectionHeading', 'TimelineItems'] },
      { type: 'Education', layout: 'list', components: ['SectionHeading', 'EducationCards'] }
    ]
  },
  Contact: {
    sections: [
      { type: 'ContactForm', layout: 'split', components: ['Heading', 'Paragraph', 'FormFields', 'PrimaryButton'] },
      { type: 'SocialLinks', layout: 'centered', components: ['Heading', 'SocialIcons'] }
    ]
  }
};
