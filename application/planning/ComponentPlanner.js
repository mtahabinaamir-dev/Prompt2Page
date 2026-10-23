/**
 * ComponentPlanner
 * Converts a ResolvedWebsitePlan into a ComponentPlan by mapping
 * each resolved section to ordered component definitions.
 *
 * No HTML. No filesystem. No rendering. No AI. No UseCases.
 */
const path = require('path');

const ComponentPlan = require('./models/ComponentPlan');

class ComponentPlanner {
  constructor(knowledgeDir) {
    this.knowledgeDir = knowledgeDir || path.join(__dirname, '..', '..', 'knowledge', 'components');
  }

  plan(resolvedWebsitePlan) {
    const business = resolvedWebsitePlan.business || 'generic';
    const componentMap = this._loadComponents(business);
    const styles = (resolvedWebsitePlan.style || []).map(s => String(s).toLowerCase());

    const plannedPages = [];

    for (const page of resolvedWebsitePlan.pages || []) {
      const pageComponents = [];

      for (const section of page.sections || []) {
        const sectionComponents = this._resolveSection(section, componentMap, styles);
        pageComponents.push(...sectionComponents);
      }

      plannedPages.push({
        name: page.name,
        isHomepage: page.isHomepage,
        components: pageComponents
      });
    }

    return new ComponentPlan({
      business,
      projectName: resolvedWebsitePlan.projectName || '',
      pages: plannedPages,
      style: resolvedWebsitePlan.style || [],
      themes: resolvedWebsitePlan.themes || [],
      constraints: resolvedWebsitePlan.constraints || {},
      animations: resolvedWebsitePlan.animations || []
    });
  }

  _loadComponents(business) {
    try {
      return require(path.join(this.knowledgeDir, business));
    } catch {
      return require(path.join(this.knowledgeDir, 'generic'));
    }
  }

  _resolveSection(section, componentMap, styles = []) {
    const sectionType = section.type || '';
    const definitions = componentMap[sectionType];
    // Section identity: tag every planned component with its (normalized)
    // section so renderers can group and scope styles per section.
    const sectionKey = String(sectionType || '').toLowerCase().trim().replace(/\s+/g, '') || null;

    if (definitions && Array.isArray(definitions)) {
      return definitions.map(def => {
        const comp = {
          type: def.type,
          content: this._selectTone(def, styles) || def.content || '',
          label: def.label || '',
          asset: def.asset || '',
          section: sectionKey,
          properties: { ...(def.properties || {}) }
        };
        return this._applyStyleLayout(comp, styles);
      });
    }

    // Fallback: convert blueprint component names to generic definitions.
    // A missing template degrades to a titled section — never blank headings.
    const items = [];
    for (const name of section.components || []) {
      const type = this._nameToType(name);
      const content = this._fallbackContent(name, sectionType);
      // Skip text components that would render empty; skip imageless images.
      if (!content && ['heading', 'paragraph', 'button', 'image'].includes(type)) continue;
      items.push(this._applyStyleLayout({ type, content, label: '', asset: '', section: sectionKey, properties: {} }, styles));
    }
    return items;
  }

  /**
   * Pick a tone override for a component definition when the plan carries a
   * matching style direction. First matching style wins (deterministic);
   * falls back to the default content when nothing matches.
   */
  _selectTone(def, styles) {
    const tones = def && def.tones;
    if (!tones || typeof tones !== 'object') return null;
    for (const s of styles || []) {
      if (tones[s]) return tones[s];
    }
    return null;
  }

  /**
   * Adjust component layout properties from style directions where the
   * mapping is clear. The user's explicit direction wins over the
   * blueprint default.
   */
  _applyStyleLayout(comp, styles) {
    const set = new Set(styles || []);
    if (comp.type === 'cards') {
      const props = comp.properties || (comp.properties = {});
      if (set.has('playful') || set.has('colorful')) {
        props.layout = 'carousel';
      } else if (set.has('luxury') || set.has('minimalist') || set.has('professional') || set.has('modern')) {
        props.layout = 'grid';
      }
    }
    return comp;
  }

  _fallbackContent(componentName, sectionType) {
    const title = String(sectionType || 'Section').replace(/([a-z])([A-Z])/g, '$1 $2');
    switch (componentName) {
      case 'SectionHeading':
      case 'Heading':
        return title;
      case 'PrimaryButton':
        return 'Learn More';
      default:
        return '';
    }
  }

  _nameToType(name) {
    const map = {
      Heading: 'heading',
      Paragraph: 'paragraph',
      PrimaryButton: 'button',
      HeroImage: 'image',
      SectionHeading: 'heading',
      DishCards: 'cards',
      QuoteCards: 'cards',
      TeamImage: 'image',
      TeamCards: 'cards',
      ImageGrid: 'gallery',
      FormFields: 'form',
      HoursTable: 'table',
      MapEmbed: 'map',
      SocialIcons: 'icons',
      CategoryTabs: 'tabs',
      ProductCards: 'cards',
      FeatureCards: 'cards',
      ProjectCards: 'cards',
      SkillBars: 'bars',
      ProfileImage: 'image',
      TimelineItems: 'timeline',
      EducationCards: 'cards',
      CaseStudyBlocks: 'blocks',
      IntegrationLogos: 'logos',
      TabPanels: 'tabs',
      PricingCards: 'cards',
      ComparisonTable: 'table',
      AccordionItems: 'accordion',
      ValueCards: 'cards',
      SupportChannels: 'list',
      DemoRequest: 'form'
    };
    return map[name] || 'unknown';
  }
}

module.exports = ComponentPlanner;
