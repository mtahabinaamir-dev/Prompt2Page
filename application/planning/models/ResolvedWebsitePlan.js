/**
 * ResolvedWebsitePlan
 * Immutable model that holds fully-resolved blueprints for every page and section.
 * No HTML. No filesystem. No rendering.
 */
class ResolvedWebsitePlan {
  constructor(init = {}) {
    this.business = init.business || 'general';
    this.projectName = init.projectName || '';
    this.pages = init.pages || [];
    this.style = init.style || [];
    this.themes = init.themes || [];
    this.constraints = init.constraints || {};
    this.animations = init.animations || [];
  }

  toJSON() {
    return {
      business: this.business,
      projectName: this.projectName,
      pages: this.pages,
      style: this.style,
      themes: this.themes,
      constraints: this.constraints,
      animations: this.animations
    };
  }
}

module.exports = ResolvedWebsitePlan;
