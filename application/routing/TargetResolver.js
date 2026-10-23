/**
 * TargetResolver
 *
 * Turns natural references like "the second image", "the headline",
 * "the button" into actual components on the active page.
 *
 * Strategy: detect a component-type word, detect an ordinal
 * (first/second/third/last, default = first), then pick the Nth
 * component of that type in page order.
 */
const TYPE_WORDS = {
  heading: ['heading', 'headline', 'title'],
  paragraph: ['paragraph', 'text', 'caption'],
  button: ['button'],
  image: ['image', 'picture', 'photo'],
};

const ORDINALS = {
  first: 1, '1st': 1,
  second: 2, '2nd': 2,
  third: 3, '3rd': 3,
  fourth: 4, '4th': 4,
  last: -1,
};

class TargetResolver {
  /**
   * @param {string} normalizedPrompt — lowercased, normalized user text
   * @param {Array} components — components on the active page, in order
   * @param {string} [defaultType] — fallback type when none is mentioned
   * @returns {{component: object|null, type: string|null, ordinal: number}}
   */
  resolve(normalizedPrompt, components = [], defaultType = null) {
    const prompt = ` ${normalizedPrompt || ''} `;

    let type = defaultType;
    // "button text" is the button's label — the compound must win before "text" alone maps to paragraph.
    let matched = /\bbutton text\b/.test(prompt);
    if (matched) type = 'button';
    for (const [candidate, words] of Object.entries(TYPE_WORDS)) {
      if (matched) break;
      let wordHit = false;
      for (const w of words) {
        if (new RegExp(`\\b${w}\\b`).test(prompt)) {
          type = candidate;
          wordHit = true;
          break;
        }
      }
      if (wordHit) { matched = true; break; } // an explicit type word beats the default; the default only survives when nothing matched
    }

    let ordinal = 1;
    for (const [word, n] of Object.entries(ORDINALS)) {
      if (new RegExp(`\\b${word}\\b`).test(prompt)) {
        ordinal = n;
        break;
      }
    }

    if (!type) return { component: null, type: null, ordinal };

    const ofType = components.filter(
      (c) => (c.type || '').toLowerCase() === type
    );
    if (!ofType.length) return { component: null, type, ordinal };

    const component = ordinal === -1 ? ofType[ofType.length - 1] : ofType[ordinal - 1] || null;
    return { component, type, ordinal };
  }
}

module.exports = TargetResolver;
