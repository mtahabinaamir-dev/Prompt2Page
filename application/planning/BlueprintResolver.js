/**
 * BlueprintResolver
 * Converts a WebsitePlan into a ResolvedWebsitePlan by enriching
 * each page and section with blueprint knowledge.
 *
 * No HTML. No filesystem. No rendering. No AI. No UseCases.
 */
const path = require('path');

const ResolvedWebsitePlan = require('./models/ResolvedWebsitePlan');

class BlueprintResolver {
  constructor(knowledgeDir) {
    this.knowledgeDir = knowledgeDir || path.join(__dirname, '..', '..', 'knowledge', 'blueprints');
  }

  resolve(websitePlan) {
    const business = websitePlan.business || 'generic';
    const blueprint = this._loadBlueprint(business);
    const styleSet = new Set((websitePlan.style || []).map(s => String(s).toLowerCase()));

    // Merged lookup across every page blueprint, so a one-page site can
    // resolve sections that normally live on other pages. Page-local
    // sections take precedence on name clashes.
    const mergedSections = [];
    for (const pageBlueprint of Object.values(blueprint)) {
      for (const s of pageBlueprint.sections || []) {
        if (!mergedSections.some(m => this._normalizeName(m.type) === this._normalizeName(s.type))) {
          mergedSections.push(s);
        }
      }
    }

    const resolvedPages = [];
    const pageList = websitePlan.pages || [];
    const sectionMap = websitePlan.sections || {};

    for (let i = 0; i < pageList.length; i++) {
      const pageName = pageList[i];
      const pageBlueprint = blueprint[pageName] || {};
      let plannedSections = sectionMap[pageName] || [];

      // Minimalist direction: drop the non-essential Testimonials section.
      // Deterministic; essential sections (menu, hours, contact, booking)
      // are never removed.
      if (styleSet.has('minimalist')) {
        plannedSections = plannedSections.filter(
          s => this._normalizeName(s) !== 'testimonials'
        );
      }

      const pageSectionList = [...(pageBlueprint.sections || []), ...mergedSections];
      const resolvedSections = this._resolveSections({ sections: pageSectionList }, plannedSections);

      resolvedPages.push({
        name: pageName,
        isHomepage: i === 0,
        sections: resolvedSections
      });
    }

    return new ResolvedWebsitePlan({
      business,
      projectName: websitePlan.projectName || '',
      pages: resolvedPages,
      style: websitePlan.style || [],
      themes: websitePlan.themes || [],
      constraints: websitePlan.constraints || {},
      animations: websitePlan.animations || []
    });
  }

  _loadBlueprint(business) {
    try {
      return require(path.join(this.knowledgeDir, business));
    } catch {
      return require(path.join(this.knowledgeDir, 'generic'));
    }
  }

  _normalizeName(name) {
    return String(name).toLowerCase().replace(/\s+/g, '');
  }

  _resolveSections(pageBlueprint, plannedSections) {
    const blueprintSections = pageBlueprint.sections || [];
    const resolved = [];

    for (const plannedName of plannedSections) {
      const normalizedPlanned = this._normalizeName(plannedName);
      const match = blueprintSections.find(s => this._normalizeName(s.type) === normalizedPlanned);
      if (match) {
        resolved.push({
          type: match.type,
          layout: match.layout,
          components: [...match.components]
        });
      } else {
        // Fallback for unknown sections
        resolved.push({
          type: plannedName,
          layout: 'default',
          components: ['Heading', 'Paragraph']
        });
      }
    }

    return resolved;
  }
}

module.exports = BlueprintResolver;
