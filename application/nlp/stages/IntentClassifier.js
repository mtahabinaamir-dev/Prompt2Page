/**
 * IntentClassifier
 *
 * Two-pass classification over the normalized prompt:
 *
 *   1. Structural patterns — high-precision regexes for utterances where
 *      keyword scoring is ambiguous (EDIT_TEXT vs EDIT_STYLE, greetings,
 *      undo/redo, help phrases). First match wins.
 *   2. Weighted keyword scoring — verbs = 1pt, objects = 2pts,
 *      multi-word phrases = 3pts, anti-words = −2pts. All matches use
 *      word boundaries so "hi" never matches "this".
 *
 * Records intentScore / intentMargin for the ConfidenceScorer and for
 * deciding when to ask a clarification question instead of acting.
 */
class IntentClassifier {
  constructor(dictionaryPath) {
    this.intents = require(dictionaryPath || '../dictionaries/intents');
    this.structural = [
      // "clear the button styling" / "remove the button style" / "clear
      // the hero section styling" — clearing a *style* is a scoped
      // restyle, not removing the component/section. (Without
      // "style"/"styling", "remove the button" stays REMOVE_SECTION.)
      {
        pattern: /\b(clear|remove|reset)\b[^.?!]*\b(buttons?|headings?|headlines?|titles?|hero|testimonials?|gallery|features?|services?|story|team|pricing|specials?|menu|section)\b[^.?!]*\b(styl\w+|design|theme)\b/,
        intent: 'RESTYLE',
      },
      // "create a one-page restaurant website" / "build a three-page bakery
      // site" — a page COUNT plus "website" is a build, not an ADD_PAGE.
      // Runs before the BUILD_WEBSITE pattern whose "page" guard would
      // otherwise reject it.
      {
        pattern: /\b(i need|build|create|make|generate|design)\b[^.?!]*\b(one|two|three|four|five|six|seven|eight|nine|ten|single|\d+)[-\s]?pages?\b[^.?!]*\b(website|site|webpage|web site|landing page|homepage)\b/,
        intent: 'BUILD_WEBSITE',
      },
      // "i need a restaurant website" / "build me a portfolio site" — highest
      // priority: a business name containing an intent keyword (e.g. "Component
      // Test") must never hijack the build. Excludes page commands like
      // "create an about page for the site".
      {
        pattern: /\b(i need|build|create|make|generate|design)\b(?![^.?!]*\bpage\b)[^.?!]*\b(website|site|webpage|web site|landing page|homepage)\b/,
        intent: 'BUILD_WEBSITE',
      },
      // "set the page title to Welcome" — before EDIT_TEXT, which would
      // otherwise claim "set ... title to ...".
      { pattern: /\b(set|change|update)\b[^.?!]*\bpage\s+(title|description)\b/, intent: 'PAGE_SEO' },
      // "change the buttons to green" / "make the headline red" — a color word as the new value means recolor, not a removal. (Without a color word, "change the headline to X" stays EDIT_TEXT and "remove the button" stays REMOVE_SECTION.)
      {
        pattern: /\b(change|update|set|make)\b[^.?!]*\b(buttons?|headlines?|headings?|titles?|paragraphs?|links?|texts?)\b[^.?!]*(?:\bto\b[^.?!]*)?\b(red|blue|green|yellow|orange|purple|pink|black|white|gra?y)\b/,
        intent: 'EDIT_STYLE',
      },
      // "change the headline to X" / "make the heading say Welcome"
      {
        pattern: /\b(change|update|edit|set|rewrite)\b[^.?!]*\b(headline|heading|title|button text|link text|caption|paragraph|text)\b[^.?!]*\b(to|say|into|as)\b/,
        intent: 'EDIT_TEXT',
      },
      {
        pattern: /\bmake\b[^.?!]*\b(headline|heading|title)\b[^.?!]*\bsay\b/,
        intent: 'EDIT_TEXT',
      },
      // "make the background dark" / "change the font to X"
      {
        pattern: /\b(make|change|update|set)\b[^.?!]*\b(background|color|colour|font|theme|style|spacing)\b/,
        intent: 'EDIT_STYLE',
      },
      {
        pattern: /\b(headline|heading|title|text|paragraph|button)\b[^.?!]*\b(bold|italic)\b/,
        intent: 'EDIT_STYLE',
      },
      {
        pattern: /\b(bigger|smaller|darker|lighter|warmer|cooler)\b/,
        intent: 'EDIT_STYLE',
      },
      // "move the menu above the about section"
      {
        pattern: /\bmove\b[^.?!]*\b(above|below|top|bottom|before|after|up|down|first|last)\b/,
        intent: 'MOVE_SECTION',
      },
      // "switch page About" / "go to the about page" / "open contact page"
      {
        pattern: /\bswitch\b(\s+to)?\s+page\s+[a-z0-9]/,
        intent: 'SWITCH_PAGE',
      },
      {
        pattern: /\b(take me to|go|open|show|view|navigate)\b[^.?!]*?\b[a-z0-9][a-z0-9 -]*?\s+page\b/,
        intent: 'SWITCH_PAGE',
      },
      // Media library via chat: "list assets", "rename logo.png to x", "delete logo.png"
      { pattern: /\blist\b[^.?!]*\b(assets|images|uploads|media|pictures|photos)\b/, intent: 'LIST_ASSETS' },
      {
        pattern: /\brename\b[^.?!]*(\basset\b|[\w-]+\.(png|jpe?g|gif|webp)\b)/,
        intent: 'RENAME_ASSET',
      },
      {
        pattern: /\bdelete\b[^.?!]*(\basset\b|[\w-]+\.(png|jpe?g|gif|webp)\b)/,
        intent: 'DELETE_ASSET',
      },
      // Page management: "delete the contact page", "rename about to contact"
      // (RENAME_ASSET's structural pattern runs first, so file renames win.)
      { pattern: /\b(delete|remove)\b[^.?!]*\bpage\b/, intent: 'DELETE_PAGE' },
      { pattern: /\brename\b[^.?!]*\bto\b/, intent: 'RENAME_PAGE' },
      { pattern: /\b(list|show)\b[^.?!]*\bpages?\b/, intent: 'LIST_PAGES' },
      // Site themes: "apply the dark theme", "use the ocean theme"
      { pattern: /\b(apply|use|set|switch to)\b[^.?!]*\b(dark|light|warm|ocean|forest)\s+theme\b/, intent: 'APPLY_THEME' },
      { pattern: /\b(dark|light|warm|ocean|forest)\s+theme\b/, intent: 'APPLY_THEME' },
      // Components: "add a button saying Order now" (not a section, not a page)
      {
        pattern: /\b(add|insert|put)\b(?![^.?!]*\b(section|page)\b)[^.?!]*\b(button|heading|headline|title|paragraph|text|image|component)\b/,
        intent: 'ADD_COMPONENT',
      },
      // Nuclear: "delete everything" / "start over"
      { pattern: /\b(delete|remove|clear|wipe)\b[^.?!]*\b(everything|all (my )?(sites|projects|websites))\b/, intent: 'RESET' },
      // Projects: "switch to Audit Bakery", "list my sites", "delete this site"
      // (SWITCH_PAGE / DELETE_PAGE patterns run earlier, so page commands win.)
      { pattern: /\b(list|show)\b[^.?!]*\b(sites|websites|projects)\b/, intent: 'LIST_PROJECTS' },
      { pattern: /\b(delete|remove)\b[^.?!]*\b(site|website|project)\b/, intent: 'DELETE_PROJECT' },
      {
        pattern: /\b(switch|open|go)\b(?![^.?!]*\bpage\b)[^.?!]*\b(site|website|project)\b/,
        intent: 'SWITCH_PROJECT',
      },
      {
        pattern: /\bswitch\s+to\b(?![^.?!]*\bpage\b)[^.?!]*[a-z]/,
        intent: 'SWITCH_PROJECT',
      },
      // "duplicate the about page" / "copy contact page"
      { pattern: /\b(duplicate|copy|clone)\b[^.?!]*\bpage\b/, intent: 'DUPLICATE_PAGE' },
      // "use logo.png as the hero image" / "set the hero image to logo.png"
      {
        pattern: /\buse\b[^.?!]*\b[a-z0-9][\w.-]*\.(png|jpe?g|gif|webp)\b[^.?!]*\b(as|for)\b/,
        intent: 'USE_IMAGE',
      },
      {
        pattern: /\b(set|put|place)\b[^.?!]*\b(hero image|image)\b[^.?!]*\bto\b[^.?!]*\.(png|jpe?g|gif|webp)\b/,
        intent: 'USE_IMAGE',
      },
      { pattern: /\bundo\b/, intent: 'UNDO' },
      { pattern: /\bredo\b/, intent: 'REDO' },
      { pattern: /\bwhat can you (do|build|make)\b|\bhow (do|does) (this|it|that) work\b/, intent: 'HELP' },
      // Strict greetings only — "hey, build me a site" must NOT match.
      { pattern: /^(hi|hello|hey|yo|sup|good morning|good afternoon)( there)?[!.,]*$/, intent: 'GREETING' },
    ];
  }

  process(promptAnalysis) {
    const prompt = promptAnalysis.normalizedPrompt || '';

    // RESTYLE: "make it more playful", "switch to a luxury style".
    // A restyle verb plus an extracted style/theme direction, without
    // website/page building language. Runs before structural patterns so it
    // beats SWITCH_PROJECT's "switch to" and BUILD_WEBSITE's keyword
    // scoring. Explicitly excluded: APPLY_THEME's fixed themes ("apply the
    // warm theme" — has "theme"), EDIT_STYLE property edits ("make the
    // background dark" — has "background"/"font"), and anything about
    // building a website or page.
    const designDirs = [...(promptAnalysis.styles || []), ...(promptAnalysis.themes || [])];
    if (designDirs.length > 0) {
      const hasRestyleVerb = /\b(make|switch|change|convert|restyle|redesign|use)\b/.test(prompt);
      // "site" refers to the current project in "the existing site" /
      // "this site" / "my site" — only bare "site" (or website/webpage/page/
      // build verbs) counts as building language.
      const hasBuildLang = /\b(website|webpage|page|build|create|generate)\b/.test(prompt) ||
        /(?<!\bexisting )(?<!\bthis )(?<!\bmy )(?<!\bthe )(?<!\bcurrent )(?<!\bour )\bsite\b/.test(prompt);
      const hasThemeLang = /\btheme\b/.test(prompt);
      const hasPropLang = /\b(background|font|spacing)\b/.test(prompt);
      // "make the headline bold" targets a component with a CSS property —
      // that's EDIT_STYLE. But a design variant ("playful") with a component
      // word routes to RESTYLE (possibly scoped); EDIT_STYLE can't apply it.
      const hasComponentTarget = /\b(headline|heading|title|button|paragraph|text|caption|link|image)\b/.test(prompt);
      const hasCssProp = /\b(bold|italic|bigger|smaller|darker|lighter|warmer|cooler)\b/.test(prompt);
      const isComponentEdit = hasComponentTarget && hasCssProp;
      if (hasRestyleVerb && !hasBuildLang && !hasThemeLang && !hasPropLang && !isComponentEdit) {
        promptAnalysis.intent = 'RESTYLE';
        promptAnalysis.intentScore = 10;
        promptAnalysis.intentMargin = 10;
        return promptAnalysis;
      }
    }

    for (const { pattern, intent } of this.structural) {
      if (pattern.test(prompt)) {
        promptAnalysis.intent = intent;
        promptAnalysis.intentScore = 10;
        promptAnalysis.intentMargin = 10;
        return promptAnalysis;
      }
    }

    let best = 'UNKNOWN';
    let bestScore = 0;
    let bestObjects = 0;
    let secondScore = 0;

    for (const [intent, groups] of Object.entries(this.intents)) {
      let score = 0;
      let objects = 0;

      for (const verb of groups.verbs || []) {
        score += this.countMatches(prompt, verb) * 1;
      }
      for (const obj of groups.objects || []) {
        const n = this.countMatches(prompt, obj);
        objects += n;
        score += n * (obj.includes(' ') ? 3 : 2);
      }
      for (const anti of groups.anti || []) {
        score -= this.countMatches(prompt, anti) * 2;
      }

      if (score > bestScore || (score === bestScore && score > 0 && objects > bestObjects)) {
        secondScore = bestScore;
        bestScore = score;
        bestObjects = objects;
        best = intent;
      } else if (score > secondScore) {
        secondScore = score;
      }
    }

    promptAnalysis.intent = bestScore > 0 ? best : 'UNKNOWN';
    promptAnalysis.intentScore = bestScore;
    promptAnalysis.intentMargin = bestScore - secondScore;
    return promptAnalysis;
  }

  countMatches(prompt, phrase) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = prompt.match(new RegExp(`\\b${escaped}\\b`, 'g'));
    return matches ? matches.length : 0;
  }
}

module.exports = IntentClassifier;
