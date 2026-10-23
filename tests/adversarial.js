/**
 * Adversarial test battery for Prompt2Page.
 * Hammers the running server with hostile and weird inputs, then inspects
 * the generated HTML on disk for escaping failures.
 *
 * Run: node tests/adversarial.js   (server must be on :3000)
 */
const BASE = 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name} — ${detail}`); }
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  << ' + detail}`);
}

async function postCommand(command) {
  const res = await fetch(`${BASE}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function main() {
  // 1. Server must not crash on garbage bodies
  for (const [name, body, ctype] of [
    ['empty body', '', 'application/json'],
    ['null command', JSON.stringify({ command: null }), 'application/json'],
    ['numeric command', JSON.stringify({ command: 12345 }), 'application/json'],
    ['array command', JSON.stringify({ command: ['a', 'b'] }), 'application/json'],
    ['nested object', JSON.stringify({ command: { text: 'hi' } }), 'application/json'],
    ['huge command', JSON.stringify({ command: 'a'.repeat(200000) }), 'application/json'],
    ['wrong content-type', 'command=hi', 'text/plain'],
  ]) {
    try {
      const res = await fetch(`${BASE}/command`, { method: 'POST', headers: { 'Content-Type': ctype }, body });
      check(`no crash: ${name}`, res.status < 500, `status ${res.status}`);
    } catch (e) {
      check(`no crash: ${name}`, false, 'fetch threw: ' + e.message);
    }
  }

  // 2. XSS via project name — must be escaped in generated HTML
  const xssName = '"><script>alert(1)</script>' + Date.now().toString(36);
  let r = await postCommand(`i need a restaurant website for ${xssName}`);
  check('xss build: server responds', r.status === 200 && r.json, `status ${r.status}`);
  // Whatever the pipeline names the project, the raw payload must never
  // appear unescaped in any generated file.
  {
    let foundRaw = false;
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.html') && fs.readFileSync(p, 'utf8').includes('<script>alert(1)</script>')) foundRaw = true;
      }
    };
    try { walk(path.join(__dirname, '..', 'generated', 'projects')); } catch {}
    check('xss build: no raw <script> anywhere in generated HTML', !foundRaw, foundRaw ? 'RAW SCRIPT FOUND' : 'all projects scanned');
  }

  // 3. XSS via edit text
  r = await postCommand('change the headline to <img src=x onerror=alert(2)>');
  check('xss edit: server responds 200', r.status === 200, `status ${r.status}`);
  // re-read generated html of active project
  {
    const st = await (await fetch(`${BASE}/state`)).json();
    const slug = String(st.activeProject || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const dir = path.join(__dirname, '..', 'generated', 'projects', slug, 'pages');
    let raw = false;
    try {
      for (const page of fs.readdirSync(dir)) {
        const f = path.join(dir, page, 'index.html');
        if (!fs.existsSync(f)) continue;
        const html = fs.readFileSync(f, 'utf8');
        if (/<img src=x onerror=alert\(2\)>/.test(html)) raw = true;
      }
    } catch {}
    check('xss edit: payload escaped in HTML', !raw, raw ? 'RAW ONERROR FOUND' : 'checked');
  }

  // 4. Path traversal via project name
  r = await postCommand('i need a portfolio website for ../../evil');
  check('traversal: no dir escapes generated/projects', (() => {
    try {
      const evil = path.join(__dirname, '..', 'evil');
      const evil2 = path.join(__dirname, '..', 'generated', 'evil');
      return !fs.existsSync(evil) && !fs.existsSync(evil2);
    } catch { return true; }
  })(), 'check fs');

  // 5. Static file traversal
  for (const p of ['/generated/projects/../../server.js', '/%2e%2e/server.js', '/generated/projects/..%2f..%2fpackage.json']) {
    const res = await fetch(BASE + p);
    const t = await res.text();
    check(`static traversal blocked: ${p}`, !(t.includes('express') && t.includes('require')), `status ${res.status}`);
  }

  // 6. Unicode / emoji / RTL
  r = await postCommand('i need a bakery website for مخبز 🍞 קרואסון');
  check('unicode name: 200', r.status === 200 && !!r.json, `status ${r.status}`);

  // 7. Command with only spaces / very long single word
  r = await postCommand('   ');
  check('blank command: graceful', r.status === 200 && /tell me what/i.test(r.json.reply || ''), JSON.stringify(r.json).slice(0, 80));

  console.log(`\n${pass} passed, ${fail} failed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(' - ' + f)); }
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('battery crashed:', e); process.exit(2); });
