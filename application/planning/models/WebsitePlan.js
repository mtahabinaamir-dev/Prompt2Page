/**
 * WebsitePlan
 * Immutable planning model that describes what a website should contain.
 * No HTML, no components, no filesystem operations.
 */
class WebsitePlan {
  constructor(init = {}) {
    this.business = init.business || 'general';
    this.projectName = init.projectName || '';
    this.pages = init.pages || [];
    this.navigation = init.navigation || [];
    this.style = init.style || [];
    this.themes = init.themes || [];
    this.constraints = init.constraints || {};
    this.animations = init.animations || [];
    this.sections = init.sections || {};
  }

  toJSON() {
    return {
      business: this.business,
      projectName: this.projectName,
      pages: this.pages,
      navigation: this.navigation,
      style: this.style,
      themes: this.themes,
      constraints: this.constraints,
      animations: this.animations,
      sections: this.sections
    };
  }
}

module.exports = WebsitePlan;
