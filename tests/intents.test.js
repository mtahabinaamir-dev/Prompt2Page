/**
 * Intent taxonomy tests — the contract for Prompt2Page's natural-language brain.
 *
 * Every message a user types must resolve to one of these intents.
 * There is no command syntax to learn: "i need a restaurant website",
 * "build me a resto site" and "restaurant website please" are all BUILD_WEBSITE.
 *
 * Run: npx vitest run
 */
import { describe, it, expect } from 'vitest';
import NLPEngine from '../application/nlp/NLPEngine.js';

const engine = new NLPEngine();

function intentOf(prompt) {
  return engine.analyze(prompt).intent;
}

function analysisOf(prompt) {
  return engine.analyze(prompt);
}

describe('BUILD_WEBSITE — describing the site you want', () => {
  const cases = [
    ['i need a restaurant website', 'restaurant'],
    ['build me a portfolio site', 'portfolio'],
    ['create a website for my bakery', 'bakery'],
    ['i want a barber shop website', 'barber'],
    ['make me a gym website', 'gym'],
    ['design a landing page for my saas', 'saas'],
    ['restaurant website please', 'restaurant'],
    ['can you build a website for my cafe?', 'cafe'],
    ['i need a coffee shop website', 'cafe'],
    ['i need a site for my dental clinic', 'dentist'],
    ['make a website for my store', 'store'],
  ];
  for (const [prompt, business] of cases) {
    it(`"${prompt}"`, () => {
      const a = analysisOf(prompt);
      expect(a.intent).toBe('BUILD_WEBSITE');
      expect(a.entities.business).toBe(business);
    });
  }
});

describe('ADD_SECTION — growing the page', () => {
  const cases = [
    'add a menu section',
    'add testimonials to the page',
    'put a contact form on the site',
    'add a photo gallery',
    'i want a pricing section',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('ADD_SECTION');
    });
  }
});

describe('EDIT_TEXT — changing words', () => {
  const cases = [
    'change the headline to Fresh Coffee Daily',
    'make the heading say Welcome',
    'update the title to My Bakery',
    'change the button text to Order Now',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('EDIT_TEXT');
    });
  }
});

describe('EDIT_STYLE — changing the look', () => {
  const cases = [
    'make the background dark',
    'change the background color to blue',
    'make the headline bigger',
    "i don't like the colors, make it warmer",
    'change the font to something modern',
    'make the headline bold',
    'make the text italic',
    'change the buttons to green',
    'make the buttons green',
    'change the headline to green',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('EDIT_STYLE');
    });
  }

  it('markup in a name does not hijack the intent', () => {
    expect(intentOf('i need a bakery website for <b>Bold</b> Bakes')).toBe('BUILD_WEBSITE');
  });
});

describe('REMOVE_SECTION — taking things away', () => {
  const cases = [
    'remove the gallery',
    'delete the second image',
    'take out the testimonials section',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('REMOVE_SECTION');
    });
  }
});

describe('MOVE_SECTION — rearranging', () => {
  const cases = [
    'move the menu above the about section',
    'move the contact form to the top',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('MOVE_SECTION');
    });
  }
});

describe('ADD_PAGE — new pages', () => {
  const cases = [
    'add a contact page',
    'create an about page for the site',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('ADD_PAGE');
    });
  }
});

describe('SWITCH_PAGE — jumping to an existing page', () => {
  const cases = [
    'switch page About',
    'switch to page Home',
    'go to the about page',
    'go to the home page',
    'open the menu page',
    'open contact page',
    'show me the contact page',
    'take me to the home page',
    'navigate to the menu page',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('SWITCH_PAGE');
    });
  }

  it('does not steal "add a contact page" from ADD_PAGE', () => {
    expect(intentOf('add a contact page')).toBe('ADD_PAGE');
  });

  it('does not steal "delete the gallery image" from REMOVE_SECTION', () => {
    expect(intentOf('delete the gallery image')).toBe('REMOVE_SECTION');
  });
});

describe('Media library intents', () => {
  const cases = [
    ['list assets', 'LIST_ASSETS'],
    ['show my images', 'LIST_ASSETS'],
    ['list my uploads', 'LIST_ASSETS'],
    ['rename logo.png to logo-new.png', 'RENAME_ASSET'],
    ['rename asset logo.png to new-logo.png', 'RENAME_ASSET'],
    ['delete logo.png', 'DELETE_ASSET'],
    ['delete asset old-photo.jpg', 'DELETE_ASSET'],
    ['use logo.png as the hero image', 'USE_IMAGE'],
    ['set the hero image to banner.webp', 'USE_IMAGE'],
  ];
  for (const [prompt, intent] of cases) {
    it(`"${prompt}" → ${intent}`, () => {
      expect(intentOf(prompt)).toBe(intent);
    });
  }
});

describe('Page, theme and component intents', () => {
  const cases = [
    ['delete the contact page', 'DELETE_PAGE'],
    ['remove page about', 'DELETE_PAGE'],
    ['rename about to about us', 'RENAME_PAGE'],
    ['rename the contact page to reach us', 'RENAME_PAGE'],
    ['apply the dark theme', 'APPLY_THEME'],
    ['use the ocean theme', 'APPLY_THEME'],
    ['add a button saying Order now', 'ADD_COMPONENT'],
    ['add a heading', 'ADD_COMPONENT'],
    ['insert a paragraph', 'ADD_COMPONENT'],
  ];
  for (const [prompt, intent] of cases) {
    it(`"${prompt}" → ${intent}`, () => {
      expect(intentOf(prompt)).toBe(intent);
    });
  }

  it('does not steal "add a pricing section" from ADD_SECTION', () => {
    expect(intentOf('add a pricing section')).toBe('ADD_SECTION');
  });

  it('does not steal "add a contact page" from ADD_PAGE', () => {
    expect(intentOf('add a contact page')).toBe('ADD_PAGE');
  });
});

describe('Project intents', () => {
  it('does not let a business name hijack the build ("Component Test" -> BUILD_WEBSITE)', () => {
    expect(intentOf('i need a restaurant website for Component Test')).toBe('BUILD_WEBSITE');
  });

  const cases = [
    ['switch to Audit Bakery', 'SWITCH_PROJECT'],
    ['open the bakery site', 'SWITCH_PROJECT'],
    ['list my sites', 'LIST_PROJECTS'],
    ['show my projects', 'LIST_PROJECTS'],
    ['delete this site', 'DELETE_PROJECT'],
    ['remove the old website', 'DELETE_PROJECT'],
    ['delete everything', 'RESET'],
    ['wipe all my sites', 'RESET'],
  ];
  for (const [prompt, intent] of cases) {
    it(`"${prompt}" → ${intent}`, () => {
      expect(intentOf(prompt)).toBe(intent);
    });
  }

  it('does not steal "switch page about" from SWITCH_PAGE', () => {
    expect(intentOf('switch page about')).toBe('SWITCH_PAGE');
  });

  it('does not steal "delete the contact page" from DELETE_PAGE', () => {
    expect(intentOf('delete the contact page')).toBe('DELETE_PAGE');
  });
});

describe('Duplicate and SEO intents', () => {  const cases = [
    ['duplicate the about page', 'DUPLICATE_PAGE'],
    ['copy contact page', 'DUPLICATE_PAGE'],
    ['set the page title to Welcome', 'PAGE_SEO'],
    ['change the page description to Best bakery in town', 'PAGE_SEO'],
  ];
  for (const [prompt, intent] of cases) {
    it(`"${prompt}" → ${intent}`, () => {
      expect(intentOf(prompt)).toBe(intent);
    });
  }
});

describe('EXPORT — getting the site out', () => {
  const cases = [
    'export as zip',
    'download the website',
    'export the site',
  ];
  for (const prompt of cases) {
    it(`"${prompt}"`, () => {
      expect(intentOf(prompt)).toBe('EXPORT');
    });
  }
});

describe('UNDO / REDO', () => {
  it('"undo that" → UNDO', () => {
    expect(intentOf('undo that')).toBe('UNDO');
  });
  it('"redo" → REDO', () => {
    expect(intentOf('redo')).toBe('REDO');
  });
});

describe('HELP', () => {
  it('"help" → HELP', () => {
    expect(intentOf('help')).toBe('HELP');
  });
  it('"what can you do" → HELP', () => {
    expect(intentOf('what can you do')).toBe('HELP');
  });
});

describe('GREETING — small talk gets a friendly reply, not an error', () => {
  for (const prompt of ['hi', 'hello', 'hey there']) {
    it(`"${prompt}" → GREETING`, () => {
      expect(intentOf(prompt)).toBe('GREETING');
    });
  }
});

describe('UNKNOWN — genuine nonsense stays unknown (→ clarification, never an error)', () => {
  for (const prompt of ['asdfghjkl', "what's the weather like"]) {
    it(`"${prompt}" → UNKNOWN`, () => {
      expect(intentOf(prompt)).toBe('UNKNOWN');
    });
  }
});

describe('confidence — the engine knows when it is unsure', () => {
  it('is high for a clear build request', () => {
    expect(analysisOf('i need a restaurant website').confidence).toBeGreaterThan(0.5);
  });
  it('is low for nonsense', () => {
    expect(analysisOf('asdfghjkl').confidence).toBeLessThan(0.4);
  });
});
