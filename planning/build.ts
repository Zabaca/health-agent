#!/usr/bin/env bun
// Bundles every chapter .md in this folder into a single self-contained
// plan.html with mermaid diagrams rendered client-side via CDN.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = import.meta.dir;
const OUT = join(DIR, "plan.html");

const all = await readdir(DIR);
const chapters = all
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .sort();

const readme = await readFile(join(DIR, "README.md"), "utf-8");
const chapterContents = await Promise.all(
  chapters.map(async (f) => ({
    file: f,
    content: await readFile(join(DIR, f), "utf-8"),
  })),
);

// We don't preprocess ```mermaid fences server-side anymore. Marked's HTML-block
// detector chokes on very long single-line attributes (the base64 source can be
// thousands of chars), and falls back to escaping the whole tag as text. Instead
// we register a custom marked renderer client-side that emits the placeholder
// for any ```mermaid code block — marked then never goes through HTML-block
// detection at all, because the input it sees is a vanilla fenced code block.
function preprocess(md: string): string {
  return md;
}

// Embed each chapter as a <script type="text/markdown"> blob to avoid
// HTML-escaping headaches in template strings. The browser does not execute
// these; client-side JS reads .textContent and parses with marked.
function embedAsScript(id: string, md: string): string {
  return `<script type="text/markdown" id="md-${id}">\n${preprocess(md)}\n</script>`;
}

const tocItems = chapterContents
  .map(({ file }) => {
    const id = file.replace(/\.md$/, "");
    const label = file.replace(/^\d+-/, "").replace(/\.md$/, "").replace(/-/g, " ");
    return `<li><a href="#${id}">${label}</a></li>`;
  })
  .join("\n");

const chapterArticles = chapterContents
  .map(({ file }) => {
    const id = file.replace(/\.md$/, "");
    return `<article id="${id}" class="chapter"></article>`;
  })
  .join("\n");

const chapterScripts = chapterContents
  .map(({ file, content }) => embedAsScript(file.replace(/\.md$/, ""), content))
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Real-time Notifications, Presence & Collaboration — Architecture Research</title>
<style>
  :root {
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #666;
    --accent: #2563eb;
    --border: #e5e7eb;
    --code-bg: #f5f5f5;
    --table-stripe: #fafafa;
    --max: 1200px;
    --prose: 820px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d1117;
      --fg: #e6edf3;
      --muted: #8b949e;
      --accent: #58a6ff;
      --border: #30363d;
      --code-bg: #161b22;
      --table-stripe: #161b22;
    }
  }
  html, body { background: var(--bg); color: var(--fg); }
  body {
    margin: 0;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
  }
  main { max-width: var(--max); margin: 2rem auto; padding: 0 1.25rem; }
  /* Keep prose at a comfortable reading width while letting diagrams,
     tables, and code use the full column. */
  main p, main h1, main h2, main h3, main h4, main ul, main ol, main blockquote {
    max-width: var(--prose);
  }
  pre.mermaid, table, pre:not(.mermaid) { width: 100%; }
  h1, h2, h3, h4 { line-height: 1.25; }
  h1 { font-size: 1.9rem; margin-top: 2.5rem; border-bottom: 2px solid var(--border); padding-bottom: 0.4rem; }
  h2 { font-size: 1.4rem; margin-top: 2rem; }
  h3 { font-size: 1.15rem; margin-top: 1.5rem; }
  a { color: var(--accent); }
  code { background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
  pre {
    background: var(--code-bg);
    padding: 0.85rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid var(--border);
  }
  /* Mermaid diagrams render inside iframes so they can use viewport width
     while the surrounding prose stays at the comfortable reading width. */
  iframe.mermaid-frame {
    display: block;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    border: 0;
    background: transparent;
    min-height: 360px;
    transition: height 0.15s ease;
  }
  /* Avoid double horizontal scroll when the iframe content is itself scrollable */
  body { overflow-x: hidden; }
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
  .toc {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
  }
  .toc h2 { margin: 0 0 0.5rem; font-size: 1.05rem; }
  .toc ol { margin: 0; padding-left: 1.25rem; }
  .toc li { margin: 0.15rem 0; text-transform: capitalize; }
  .chapter { padding-top: 1rem; }
  .topbar { font-size: 0.85em; color: var(--muted); margin-bottom: 1rem; }
  .topbar a { color: var(--muted); }
  @page {
    size: letter;
    margin: 0.6in 0.55in;
  }
  @media print {
    html, body { background: #fff !important; color: #000 !important; }
    body { font-size: 10.5pt; }
    main { max-width: none; margin: 0; padding: 0; }
    .topbar { display: none; }

    /* Each chapter starts on a fresh page; the readme + TOC stay on page 1 */
    .chapter {
      break-before: page;
      page-break-before: always;
      padding-top: 0;
    }

    /* Headings stay attached to the content that follows them */
    h1, h2, h3, h4 {
      break-after: avoid;
      page-break-after: avoid;
    }
    h1 { font-size: 17pt; margin-top: 0; border-bottom: 1.5px solid #999; }
    h2 { font-size: 13pt; }
    h3 { font-size: 11.5pt; }

    /* Don't split atomic content blocks across pages */
    pre, table, blockquote, .toc, figure, ul, ol {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    pre.mermaid { max-height: 9in; }
    pre.mermaid svg {
      max-width: 100% !important;
      height: auto !important;
      max-height: 8.5in;
    }

    /* Tables: tighter and don't orphan the header */
    table { font-size: 9.5pt; }
    th, td { padding: 0.28rem 0.45rem; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }

    /* Paragraphs: avoid 1-line orphans/widows */
    p, li { orphans: 3; widows: 3; }

    /* Anchor links print as plain black; keep external URLs visible */
    a { color: #000; text-decoration: none; }
  }
</style>
</head>
<body>
<main>
  <div class="topbar">Open in any browser. Use <kbd>Cmd</kbd>+<kbd>P</kbd> → Save as PDF for a portable export. Each chapter starts on its own page; check "Background graphics" in the print dialog to keep table shading and code blocks visible.</div>

  <article id="readme"></article>

  <nav class="toc">
    <h2>Chapters</h2>
    <ol>
      ${tocItems}
    </ol>
  </nav>

  ${chapterArticles}
</main>

<script type="text/markdown" id="md-readme">
${readme}
</script>
${chapterScripts}

<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script>
  let _mfrCount = 0;

  // 1) Render every <script type="text/markdown" id="md-X"> into the matching
  // <article id="X">. Marked emits <pre><code class="language-mermaid"> for
  // fenced mermaid blocks; we post-process those into placeholder divs.
  document.querySelectorAll('script[type="text/markdown"]').forEach((s) => {
    const targetId = s.id.replace(/^md-/, '');
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = window.marked.parse(s.textContent.trim(), { gfm: true, breaks: false });

    // Post-process: swap each marked-emitted mermaid code block for a placeholder
    // div carrying the source as base64. Iterating per-article preserves DOM order
    // and avoids race conditions with the next step.
    target.querySelectorAll('pre > code.language-mermaid').forEach((codeEl) => {
      const id = 'mfr-' + (++_mfrCount);
      const text = codeEl.textContent || '';
      const b64 = btoa(unescape(encodeURIComponent(text)));
      const div = document.createElement('div');
      div.className = 'mermaid-placeholder';
      div.id = id;
      div.setAttribute('data-mermaid-b64', b64);
      const pre = codeEl.parentElement; // the <pre>
      pre.replaceWith(div);
    });
  });

  // 2) Build a self-contained mermaid renderer document (HTML + CSS + JS) for
  // a single diagram source string. Returned as one HTML string suitable for
  // assigning to iframe.srcdoc — no escaping needed since we pass it via the
  // JS property, not via attribute serialization.
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

  // 3) Replace each placeholder <div> with a fresh iframe whose srcdoc is set
  // via the JS property (no attribute-string escaping pitfalls).
  document.querySelectorAll('.mermaid-placeholder').forEach((el) => {
    const b64 = el.getAttribute('data-mermaid-b64') || '';
    let source = '';
    try {
      // Decode base64 to bytes, then UTF-8 to string. atob alone mangles non-ASCII.
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

  // 4) Iframes postMessage their rendered height back; resize so the diagram
  // sits inline without an internal scrollbar.
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || data.type !== 'mermaid-iframe-resize') return;
    const frame = document.getElementById(data.id) || document.getElementsByName(data.id)[0];
    if (frame && typeof data.height === 'number') {
      frame.style.height = (data.height + 8) + 'px';
    }
  });
</script>
</body>
</html>
`;

await writeFile(OUT, html, "utf-8");
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(1)} KB)`);
