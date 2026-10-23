/**
 * Group consecutive components that share a section identity.
 * Returns [{ section: string|null, items: [...] }] in original order.
 * Used by both HTMLRenderer (preview) and ComponentService (the page.html
 * record exports are built from) so both render paths wrap identically.
 */
function groupBySection(components) {
  const groups = [];
  for (const comp of Array.isArray(components) ? components : []) {
    const section = comp && typeof comp.section === 'string' && comp.section.trim()
      ? comp.section.trim().toLowerCase()
      : null;
    // Explicit section components manage their own wrapper.
    const key = section && comp.type !== 'section' ? section : null;
    const last = groups[groups.length - 1];
    if (key && last && last.section === key) {
      last.items.push(comp);
    } else {
      groups.push({ section: key, items: [comp] });
    }
  }
  return groups;
}

module.exports = { groupBySection };
