/**
 * Intent taxonomy for Prompt2Page's conversational product.
 *
 * There is no command syntax. Every message resolves to one of these intents:
 *
 *   BUILD_WEBSITE  "i need a restaurant website"      → builds a full site
 *   ADD_SECTION    "add a menu section"               → grows the active page
 *   ADD_PAGE       "add a contact page"               → new page on the site
 *   SWITCH_PAGE    "switch to the about page"         → jumps to an existing page
 *   EDIT_TEXT      "change the headline to X"         → changes words
 *   EDIT_STYLE     "make the background dark"         → changes the look
 *   REMOVE_SECTION "remove the gallery"               → takes things away
 *   MOVE_SECTION   "move the menu above about"        → rearranges
 *   EXPORT         "export as zip"                    → gets the site out
 *   LIST_ASSETS    "list my images"                   → shows uploaded assets
 *   RENAME_ASSET   "rename logo.png to logo-new.png"  → renames an asset
 *   DELETE_ASSET   "delete logo.png"                  → deletes an asset
 *   USE_IMAGE      "use logo.png as the hero image"   → puts an asset in the site
 *   SWITCH_PAGE    "switch to the about page"         → jumps to an existing page
 *   DELETE_PAGE    "delete the contact page"          → removes a page
 *   RENAME_PAGE    "rename about to about us"         → renames a page
 *   LIST_PAGES     "list pages"                       → shows all pages
 *   APPLY_THEME    "apply the dark theme"             → themes the whole site
 *   RESTYLE        "make it more playful"             → restyles the existing site
 *   ADD_COMPONENT  "add a button saying Order now"    → drops in a component
 *   RESET          "delete everything"                → wipes all sites
 *   SWITCH_PROJECT "switch to Audit Bakery"           → opens another site
 *   LIST_PROJECTS  "list my sites"                    → shows all sites
 *   DELETE_PROJECT "delete this site"                 → removes one site
 *   DUPLICATE_PAGE "duplicate the about page"        → copies a page
 *   PAGE_SEO       "set the page title to X"          → per-page SEO
 *   UNDO / REDO    "undo that"
 *   HELP           "what can you do"
 *   GREETING       "hi"                               → friendly reply
 *   UNKNOWN        genuine nonsense → clarification question, never an error
 *
 * Scoring: verbs = 1pt, objects = 2pts, multi-word phrases = 3pts,
 * anti-words = −2pts (they veto an intent, e.g. "page" vetoes BUILD_WEBSITE).
 * High-precision structural patterns live in the IntentClassifier.
 */
module.exports = {
  BUILD_WEBSITE: {
    verbs: ['build', 'create', 'make', 'generate', 'design', 'need', 'want', 'get'],
    objects: ['website', 'site', 'webpage', 'web site', 'landing page', 'homepage', 'home page'],
    anti: ['page', 'pages', 'section'],
  },
  ADD_SECTION: {
    verbs: ['add', 'insert', 'put', 'place', 'include', 'create'],
    objects: [
      'section', 'menu', 'testimonials', 'testimonial', 'gallery', 'form',
      'pricing', 'faq', 'hero', 'features', 'contact form', 'newsletter',
      'about section', 'menu section',
    ],
  },
  ADD_PAGE: {
    verbs: ['add', 'create', 'make', 'new'],
    objects: ['page', 'pages'],
    anti: ['switch', 'go to', 'open'],
  },
  SWITCH_PAGE: {
    verbs: ['switch', 'go', 'open', 'show', 'view', 'navigate'],
    objects: ['page'],
    anti: ['add', 'create', 'make', 'new'],
  },
  EDIT_TEXT: {
    verbs: ['change', 'update', 'edit', 'make', 'set', 'rewrite'],
    objects: [
      'headline', 'heading', 'title', 'text', 'paragraph', 'caption',
      'button text', 'link text',
    ],
  },
  EDIT_STYLE: {
    verbs: ['change', 'make', 'update', 'set'],
    objects: [
      'background', 'color', 'colour', 'font', 'theme', 'style',
      'bigger', 'smaller', 'darker', 'lighter', 'warmer', 'cooler',
      'bold', 'italic', 'size',
    ],
  },
  REMOVE_SECTION: {
    verbs: ['remove', 'delete', 'take out', 'get rid of', 'drop'],
    objects: [
      'section', 'gallery', 'image', 'picture', 'testimonials', 'menu',
      'form', 'hero', 'pricing', 'button',
    ],
  },
  MOVE_SECTION: {
    verbs: ['move', 'shift', 'reorder'],
    objects: [
      'section', 'menu', 'form', 'gallery', 'image', 'button',
      'above', 'below', 'top', 'bottom', 'up', 'down', 'first', 'last',
    ],
  },
  EXPORT: {
    verbs: ['export', 'download', 'save', 'publish'],
    objects: ['zip', 'website', 'site', 'project', 'html'],
  },
  LIST_ASSETS: {
    verbs: ['list', 'show'],
    objects: ['assets', 'images', 'uploads', 'media', 'pictures', 'photos'],
    anti: ['page', 'section'],
  },
  RENAME_ASSET: {
    verbs: ['rename'],
    objects: ['asset', 'image', 'photo', 'picture', 'logo', 'file'],
  },
  DELETE_ASSET: {
    verbs: ['delete', 'remove'],
    objects: ['asset', 'image', 'photo', 'picture', 'logo', 'file'],
    anti: ['section', 'page'],
  },
  USE_IMAGE: {
    verbs: ['use', 'set', 'put', 'place'],
    objects: ['image', 'photo', 'picture', 'logo'],
    anti: ['page', 'section'],
  },
  DELETE_PAGE: {
    verbs: ['delete', 'remove'],
    objects: ['page'],
    anti: ['section'],
  },
  LIST_PAGES: {
    verbs: ['list', 'show'],
    objects: ['page', 'pages'],
    anti: ['section', 'asset', 'image'],
  },
  RENAME_PAGE: {
    verbs: ['rename'],
    objects: ['page'],
  },
  APPLY_THEME: {
    verbs: ['apply', 'use', 'set', 'switch'],
    objects: ['theme'],
    anti: ['page'],
  },
  RESTYLE: {
    verbs: ['restyle', 'redesign', 'make', 'switch', 'change', 'convert', 'use'],
    objects: ['style', 'design', 'look', 'appearance', 'colors', 'colours'],
    anti: ['website', 'site', 'page', 'theme'],
  },
  ADD_COMPONENT: {
    verbs: ['add', 'insert', 'put'],
    objects: ['button', 'heading', 'paragraph', 'image', 'headline', 'title', 'text'],
    anti: ['page', 'section'],
  },
  RESET: {
    verbs: ['delete', 'remove', 'clear', 'wipe'],
    objects: ['everything', 'all'],
    anti: ['page', 'section', 'asset', 'image'],
  },
  SWITCH_PROJECT: {
    verbs: ['switch', 'open', 'go'],
    objects: ['site', 'website', 'project'],
    anti: ['page', 'section'],
  },
  LIST_PROJECTS: {
    verbs: ['list', 'show'],
    objects: ['sites', 'websites', 'projects'],
    anti: ['page', 'section', 'asset', 'image'],
  },
  DELETE_PROJECT: {
    verbs: ['delete', 'remove'],
    objects: ['site', 'website', 'project'],
    anti: ['page', 'section', 'asset', 'image'],
  },
  DUPLICATE_PAGE: {
    verbs: ['duplicate', 'copy', 'clone'],
    objects: ['page'],
    anti: ['section'],
  },
  PAGE_SEO: {
    verbs: ['set', 'change', 'update'],
    objects: ['title', 'description'],
    anti: ['section'],
  },
  UNDO: {
    verbs: ['undo'],
    objects: [],
  },
  REDO: {
    verbs: ['redo'],
    objects: [],
  },
  HELP: {
    verbs: ['help'],
    objects: ['do', 'work', 'features', 'commands', 'build'],
  },
  GREETING: {
    verbs: ['hi', 'hello', 'hey'],
    objects: [],
  },
};
