/**
 * WebsitePlanner
 * Converts a PromptAnalysis into a WebsitePlan.
 * No rendering. No filesystem. No HTML. No AI.
 */
const fs = require('fs');
const path = require('path');

const WebsitePlan = require('./models/WebsitePlan');

class WebsitePlanner {
  constructor(knowledgeDir) {
    this.knowledgeDir = knowledgeDir || path.join(__dirname, '..', '..', 'knowledge', 'planning');
    this.businessPages = require(path.join(this.knowledgeDir, 'businessPages'));
    this.businessSections = require(path.join(this.knowledgeDir, 'businessSections'));
  }

  plan(promptAnalysis) {
    const business = this._resolveBusiness(promptAnalysis);
    const projectName = this._resolveProjectName(promptAnalysis, business);
    const pageCount = this._resolvePageCount(promptAnalysis);
    const pages = this._resolvePages(business, pageCount);
    const sections = this._resolveSections(business, pages, pageCount);

    return new WebsitePlan({
      business,
      projectName,
      pages,
      navigation: [...pages],
      style: promptAnalysis.styles || [],
      themes: promptAnalysis.themes || [],
      constraints: promptAnalysis.constraints || {},
      animations: [],
      sections
    });
  }

  _resolveBusiness(promptAnalysis) {
    const entities = promptAnalysis.entities || {};
    return entities.business || 'general';
  }

  _resolveProjectName(promptAnalysis, business) {
    const constraints = promptAnalysis.constraints || {};

    if (constraints.projectName) {
      return constraints.projectName;
    }

    const normalized = promptAnalysis.normalizedPrompt || '';
    const nameMatch = normalized.match(/(?:for|named|called)\s+([a-z0-9\s-_]+)/i);
    if (nameMatch && nameMatch[1].trim()) {
      return nameMatch[1].trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    const capitalized = business.charAt(0).toUpperCase() + business.slice(1);
    return `${capitalized} Project`;
  }

  _resolvePageCount(promptAnalysis) {
    const n = (promptAnalysis.constraints || {}).pageCount;
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  _resolvePages(business, pageCount) {
    const blueprintPages = this.businessPages[business] || this.businessPages.general;
    if (!pageCount || pageCount >= blueprintPages.length) {
      return [...blueprintPages];
    }
    if (pageCount === 1) {
      return [blueprintPages[0]];
    }
    // Essentials: Home (first), core offering (second), Contact (last).
    const essentials = [...new Set([
      blueprintPages[0],
      blueprintPages[1],
      blueprintPages[blueprintPages.length - 1],
    ])].filter(Boolean);
    const chosen = essentials.slice(0, pageCount);
    for (const p of blueprintPages) {
      if (chosen.length >= pageCount) break;
      if (!chosen.includes(p)) chosen.push(p);
    }
    // Preserve blueprint order.
    return blueprintPages.filter(p => chosen.includes(p));
  }

  _resolveSections(business, pages, pageCount) {
    const sectionsMap = this.businessSections[business] || this.businessSections.general;
    const sections = {};

    if (pageCount === 1 && pages.length === 1) {
      // One-page site: merge every section from every blueprint page, in order.
      const blueprintPages = this.businessPages[business] || this.businessPages.general;
      const merged = [];
      for (const bp of blueprintPages) {
        for (const s of sectionsMap[bp] || []) {
          if (!merged.includes(s)) merged.push(s);
        }
      }
      sections[pages[0]] = merged;
      return sections;
    }

    for (const page of pages) {
      sections[page] = sectionsMap[page] || [];
    }

    return sections;
  }
}

module.exports = WebsitePlanner;
