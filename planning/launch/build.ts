#!/usr/bin/env bun
// Bundles every chapter .md in this folder into a single self-contained
// plan.html with mermaid diagrams rendered client-side via CDN, plus a
// nested sidebar table of contents with scroll-spy.
//
// Mirrors planning/build.ts in style but adds:
//   - Per-chapter h2/h3 extraction → nested TOC
//   - Auto-anchored headings (slug IDs added client-side)
//   - Sticky sidebar on desktop; collapsible disclosure on mobile
//   - Scroll-spy current-section highlight

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = import.meta.dir;
const OUT = join(DIR, "plan.html");

// --- TOC extraction --------------------------------------------------------

interface Heading { level: 2 | 3; text: string; id: string }

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  const lines = md.split("\n");
  let inFence = false;
  const seen = new Map<string, number>();
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].trim();
    let id = slug(text);
    // dedupe by appending -2, -3, etc., matching client-side behavior
    const count = (seen.get(id) ?? 0) + 1;
    seen.set(id, count);
    if (count > 1) id = `${id}-${count}`;
    out.push({ level, text, id });
  }
  return out;
}

// --- file collection -------------------------------------------------------

const all = await readdir(DIR);
const chapters = all
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

const readme = await readFile(join(DIR, "README.md"), "utf-8");
const chapterContents = await Promise.all(
  chapters.map(async (f) => {
    const content = await readFile(join(DIR, f), "utf-8");
    return {
      file: f,
      id: f.replace(/\.md$/, ""),
      label: f.replace(/^\d+-/, "").replace(/\.md$/, "").replace(/-/g, " "),
      content,
      headings: extractHeadings(content),
    };
  }),
);

// --- TOC HTML --------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Strip inline markdown that doesn't render well in TOC text (backticks, links → label only)
function tocText(s: string): string {
  return s
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}

const tocChapters = chapterContents.map((ch) => {
  const headingLis: string[] = [];
  // Build a stack-style nested list of h2/h3 under the chapter
  let inH3 = false;
  for (const h of ch.headings) {
    if (h.level === 2) {
      if (inH3) { headingLis.push("</ul></li>"); inH3 = false; }
      headingLis.push(`<li class="toc-h2"><a href="#${h.id}">${escapeHtml(tocText(h.text))}</a>`);
      // close immediately; if an h3 follows we'll open a child ul on the fly below
      headingLis.push("</li>");
    } else { // h3
      // attach to the previous h2: replace the last </li> we just pushed
      const last = headingLis[headingLis.length - 1];
      if (last === "</li>") {
        headingLis[headingLis.length - 1] = "<ul class=\"toc-h3-list\">";
        inH3 = true;
      }
      headingLis.push(`<li class="toc-h3"><a href="#${h.id}">${escapeHtml(tocText(h.text))}</a></li>`);
    }
  }
  if (inH3) headingLis.push("</ul></li>");
  const subnav = headingLis.length ? `<ul class="toc-h2-list">${headingLis.join("")}</ul>` : "";
  return `<li class="toc-chapter">
  <a href="#${ch.id}" class="toc-chapter-link">${escapeHtml(ch.label)}</a>
  ${subnav}
</li>`;
}).join("\n");

const sidebarToc = `<nav class="sidebar" aria-label="Table of contents">
  <div class="sidebar-title">On this page</div>
  <ul class="toc-root">
    <li class="toc-chapter"><a href="#readme" class="toc-chapter-link">Overview</a></li>
    ${tocChapters}
  </ul>
</nav>`;

// Top-of-page disclosure for mobile (same content, collapsed)
const mobileToc = `<details class="mobile-toc">
  <summary>📑 On this page</summary>
  <ul class="toc-root">
    <li class="toc-chapter"><a href="#readme" class="toc-chapter-link">Overview</a></li>
    ${tocChapters}
  </ul>
</details>`;

// --- embed markdown into client-parsed script blocks -----------------------

function preprocess(md: string): string { return md; }

function embedAsScript(id: string, md: string): string {
  return `<script type="text/markdown" id="md-${id}">\n${preprocess(md)}\n</script>`;
}

const chapterArticles = chapterContents
  .map((ch) => `<article id="${ch.id}" class="chapter"></article>`).join("\n");

const chapterScripts = chapterContents
  .map((ch) => embedAsScript(ch.id, ch.content)).join("\n");

// --- HTML ------------------------------------------------------------------

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Veladon — App Store + Play Store Launch Plan</title>
<style>
  :root {
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #666;
    --accent: #2563eb;
    --accent-bg: rgba(37, 99, 235, 0.1);
    --border: #e5e7eb;
    --code-bg: #f5f5f5;
    --table-stripe: #fafafa;
    --sidebar-bg: #fafafa;
    --sidebar-width: 280px;
    --max: 1280px;
    --prose: 820px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d1117;
      --fg: #e6edf3;
      --muted: #8b949e;
      --accent: #58a6ff;
      --accent-bg: rgba(88, 166, 255, 0.12);
      --border: #30363d;
      --code-bg: #161b22;
      --table-stripe: #161b22;
      --sidebar-bg: #0a0d12;
    }
  }
  html, body { background: var(--bg); color: var(--fg); }
  body {
    margin: 0;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
    overflow-x: hidden;
  }
  /* layout: sidebar fixed-left on desktop; main content offset to make room */
  .layout {
    display: flex;
    max-width: var(--max);
    margin: 0 auto;
  }
  .sidebar {
    flex: 0 0 var(--sidebar-width);
    position: sticky;
    top: 0;
    align-self: flex-start;
    height: 100vh;
    overflow-y: auto;
    padding: 1.5rem 1rem 1.5rem 1.25rem;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    font-size: 0.9em;
    line-height: 1.4;
  }
  .sidebar-title {
    font-size: 0.75em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.75rem;
    padding-left: 0.25rem;
  }
  .sidebar .toc-root { list-style: none; padding: 0; margin: 0; }
  .sidebar .toc-chapter { margin: 0.4rem 0; }
  .sidebar .toc-chapter-link {
    display: block;
    font-weight: 600;
    text-transform: capitalize;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: var(--fg);
    text-decoration: none;
  }
  .sidebar .toc-chapter-link:hover { background: var(--accent-bg); color: var(--accent); }
  .sidebar .toc-h2-list { list-style: none; padding-left: 0.75rem; margin: 0.2rem 0 0.4rem; border-left: 1px solid var(--border); }
  .sidebar .toc-h2 a, .sidebar .toc-h3 a {
    display: block;
    padding: 0.18rem 0.5rem;
    color: var(--muted);
    text-decoration: none;
    border-radius: 4px;
  }
  .sidebar .toc-h2 a:hover, .sidebar .toc-h3 a:hover { background: var(--accent-bg); color: var(--accent); }
  .sidebar .toc-h2.active > a, .sidebar .toc-h3.active > a { color: var(--accent); font-weight: 600; background: var(--accent-bg); }
  .sidebar .toc-h3-list { list-style: none; padding-left: 0.85rem; margin: 0.15rem 0; }
  .sidebar .toc-h3 a { font-size: 0.93em; }
  /* hide nested h3 unless their parent h2 is active, to keep sidebar scannable */
  .sidebar .toc-h2 .toc-h3-list { display: none; }
  .sidebar .toc-h2.active .toc-h3-list, .sidebar .toc-h2:hover .toc-h3-list { display: block; }

  main {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 4rem;
  }
  main p, main h1, main h2, main h3, main h4, main ul, main ol, main blockquote { max-width: var(--prose); }
  pre.mermaid, table, pre:not(.mermaid) { width: 100%; }
  h1, h2, h3, h4 { line-height: 1.25; }
  h1 { font-size: 1.9rem; margin-top: 2.5rem; border-bottom: 2px solid var(--border); padding-bottom: 0.4rem; }
  h2 { font-size: 1.4rem; margin-top: 2rem; scroll-margin-top: 1rem; }
  h3 { font-size: 1.15rem; margin-top: 1.5rem; scroll-margin-top: 1rem; }
  h2 .anchor, h3 .anchor {
    opacity: 0;
    margin-left: 0.4rem;
    color: var(--muted);
    text-decoration: none;
    font-weight: 400;
    transition: opacity 0.15s;
  }
  h2:hover .anchor, h3:hover .anchor { opacity: 1; }
  a { color: var(--accent); }
  code { background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
  pre {
    background: var(--code-bg);
    padding: 0.85rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid var(--border);
  }
  iframe.mermaid-frame {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    min-height: 360px;
    transition: height 0.15s ease;
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid var(--accent);
    margin: 1rem 0;
    padding: 0.25rem 1rem;
    color: var(--muted);
    background: var(--code-bg);
  }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.93em; }
  th, td { border: 1px solid var(--border); padding: 0.45rem 0.65rem; text-align: left; vertical-align: top; }
  th { background: var(--code-bg); font-weight: 600; }
  tr:nth-child(even) td { background: var(--table-stripe); }
  hr { border: 0; border-top: 1px solid var(--border); margin: 3rem 0; }
  .chapter { padding-top: 1rem; }
  .topbar { font-size: 0.85em; color: var(--muted); margin-bottom: 1rem; }
  .topbar a { color: var(--muted); }

  /* Mobile: hide sidebar, show top disclosure */
  .mobile-toc { display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: var(--sidebar-bg); border: 1px solid var(--border); border-radius: 6px; }
  .mobile-toc summary { cursor: pointer; font-weight: 600; }
  .mobile-toc .toc-root { list-style: none; padding-left: 0; margin: 0.75rem 0 0; }
  .mobile-toc .toc-chapter { margin: 0.4rem 0; }
  .mobile-toc .toc-chapter-link { font-weight: 600; text-decoration: none; color: var(--fg); text-transform: capitalize; }
  .mobile-toc .toc-h2-list, .mobile-toc .toc-h3-list { list-style: none; padding-left: 1rem; margin: 0.25rem 0; }
  .mobile-toc .toc-h2 a, .mobile-toc .toc-h3 a { color: var(--muted); text-decoration: none; display: block; padding: 0.15rem 0; }
  .mobile-toc .toc-h3 a { font-size: 0.92em; }

  @media (max-width: 900px) {
    .sidebar { display: none; }
    .mobile-toc { display: block; }
    main { padding: 1rem 1rem 3rem; }
  }

  @page { size: letter; margin: 0.6in 0.55in; }
  @media print {
    html, body { background: #fff !important; color: #000 !important; }
    body { font-size: 10.5pt; }
    .sidebar, .mobile-toc, .topbar { display: none !important; }
    .layout { display: block; max-width: none; margin: 0; }
    main { max-width: none; margin: 0; padding: 0; }
    .chapter { break-before: page; page-break-before: always; padding-top: 0; }
    h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
    h1 { font-size: 17pt; margin-top: 0; border-bottom: 1.5px solid #999; }
    h2 { font-size: 13pt; }
    h3 { font-size: 11.5pt; }
    pre, table, blockquote, figure, ul, ol { break-inside: avoid; page-break-inside: avoid; }
    pre.mermaid { max-height: 9in; }
    pre.mermaid svg { max-width: 100% !important; height: auto !important; max-height: 8.5in; }
    table { font-size: 9.5pt; }
    th, td { padding: 0.28rem 0.45rem; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    p, li { orphans: 3; widows: 3; }
    a { color: #000; text-decoration: none; }
  }
</style>
</head>
<body>
<div class="layout">
  ${sidebarToc}
  <main>
    <div class="topbar">Open in any browser. Use <kbd>Cmd</kbd>+<kbd>P</kbd> → Save as PDF for a portable export. Each chapter starts on its own page; check "Background graphics" in the print dialog to keep table shading and code blocks visible.</div>

    ${mobileToc}

    <article id="readme"></article>

    ${chapterArticles}
  </main>
</div>

<script type="text/markdown" id="md-readme">
${readme}
</script>
${chapterScripts}

<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script>
  // slug() must match the server-side TS impl in build.ts
  function slug(s) {
    return s.toLowerCase()
      .replace(/\`/g, '')
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  let _mfrCount = 0;
  const seenIds = new Map();

  document.querySelectorAll('script[type="text/markdown"]').forEach((s) => {
    const targetId = s.id.replace(/^md-/, '');
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = window.marked.parse(s.textContent.trim(), { gfm: true, breaks: false });

    // 1) Add IDs to h2/h3 so the TOC anchor links land here; also append a clickable
    //    anchor on hover so any heading can be deep-linked.
    target.querySelectorAll('h2, h3').forEach((h) => {
      const text = h.textContent || '';
      let id = slug(text);
      const count = (seenIds.get(id) || 0) + 1;
      seenIds.set(id, count);
      if (count > 1) id = id + '-' + count;
      h.id = id;
      const a = document.createElement('a');
      a.href = '#' + id;
      a.className = 'anchor';
      a.textContent = '#';
      a.setAttribute('aria-label', 'Link to this section');
      h.appendChild(a);
    });

    // 2) Swap mermaid code fences for iframe placeholders (same as parent builder).
    target.querySelectorAll('pre > code.language-mermaid').forEach((codeEl) => {
      const id = 'mfr-' + (++_mfrCount);
      const text = codeEl.textContent || '';
      const b64 = btoa(unescape(encodeURIComponent(text)));
      const div = document.createElement('div');
      div.className = 'mermaid-placeholder';
      div.id = id;
      div.setAttribute('data-mermaid-b64', b64);
      const pre = codeEl.parentElement;
      pre.replaceWith(div);
    });
  });

  function buildIframeDoc(source) {
    const esc = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return [
      '<!doctype html><html><head><meta charset="utf-8"><style>',
      'html,body{margin:0;padding:.75rem 1rem;background:transparent;font:14px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#1a1a1a}',
      '@media (prefers-color-scheme: dark){html,body{color:#e6edf3}}',
      'pre.mermaid{text-align:center;margin:0;background:transparent;border:0}',
      'pre.mermaid svg{max-width:100%;height:auto}',
      '</style></head><body>',
      '<pre class="mermaid">' + esc + '</pre>',
      '<script type="module">',
      'import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs";',
      'const dark=matchMedia("(prefers-color-scheme: dark)").matches;',
      'mermaid.initialize({startOnLoad:false,theme:dark?"dark":"default",securityLevel:"loose",flowchart:{useMaxWidth:true,htmlLabels:true},sequence:{useMaxWidth:true},gantt:{useMaxWidth:true}});',
      'try{await mermaid.run({querySelector:"pre.mermaid"})}catch(e){const p=document.createElement("pre");p.style.color="#b00";p.style.whiteSpace="pre-wrap";p.textContent="mermaid render failed: "+String(e&&e.message||e);document.body.replaceChildren(p)}',
      'const send=()=>parent.postMessage({type:"mermaid-iframe-resize",id:window.name,height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)},"*");',
      'send();requestAnimationFrame(send);new ResizeObserver(send).observe(document.body);',
      '<' + '/script>',
      '</body></html>',
    ].join('');
  }

  document.querySelectorAll('.mermaid-placeholder').forEach((el) => {
    const b64 = el.getAttribute('data-mermaid-b64') || '';
    let source = '';
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      source = new TextDecoder('utf-8').decode(bytes);
    } catch (e) { source = '/* decode error */'; }
    const iframe = document.createElement('iframe');
    iframe.className = 'mermaid-frame';
    iframe.id = el.id;
    iframe.name = el.id;
    iframe.loading = 'lazy';
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups');
    iframe.srcdoc = buildIframeDoc(source);
    el.replaceWith(iframe);
  });

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || data.type !== 'mermaid-iframe-resize') return;
    const frame = document.getElementById(data.id) || document.getElementsByName(data.id)[0];
    if (frame && typeof data.height === 'number') {
      frame.style.height = (data.height + 8) + 'px';
    }
  });

  // 3) Scroll-spy — highlight the sidebar entry for the heading nearest the top.
  //    Tracks h2/h3 elements; bubbles "active" up to the parent h2 so its h3 list shows.
  const tocLinks = new Map(); // id -> sidebar <a>
  document.querySelectorAll('.sidebar a[href^="#"]').forEach((a) => {
    tocLinks.set(a.getAttribute('href').slice(1), a);
  });

  function setActive(id) {
    document.querySelectorAll('.sidebar .toc-h2.active, .sidebar .toc-h3.active').forEach((el) => el.classList.remove('active'));
    const link = tocLinks.get(id);
    if (!link) return;
    const li = link.closest('li');
    if (!li) return;
    li.classList.add('active');
    // if this is an h3, also mark its parent h2 so the h3 list stays open
    if (li.classList.contains('toc-h3')) {
      const parentH2 = li.closest('.toc-h2');
      if (parentH2) parentH2.classList.add('active');
    }
    // scroll the sidebar to keep the active link visible
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const r = link.getBoundingClientRect();
      const sr = sidebar.getBoundingClientRect();
      if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) {
        link.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  const observed = new Set();
  document.querySelectorAll('main h2[id], main h3[id]').forEach((h) => observed.add(h));

  let lastActive = '';
  const io = new IntersectionObserver((entries) => {
    // Find the topmost intersecting heading
    const visible = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    if (visible.length === 0) return;
    const id = visible[0].id;
    if (id && id !== lastActive) {
      lastActive = id;
      setActive(id);
    }
  }, { rootMargin: '-10% 0px -75% 0px', threshold: 0 });
  observed.forEach((h) => io.observe(h));

  // initial active: whatever's in the URL hash, or the first heading
  const initial = location.hash ? location.hash.slice(1) : (observed.values().next().value || {}).id;
  if (initial) setActive(initial);
</script>
</body>
</html>
`;

await writeFile(OUT, html, "utf-8");
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`  chapters: ${chapterContents.length}`);
console.log(`  toc entries: ${chapterContents.reduce((n, c) => n + c.headings.length, 0)} (h2 + h3)`);
