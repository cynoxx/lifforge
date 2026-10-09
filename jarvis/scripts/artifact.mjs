// Turns the single-file build into a claude.ai Artifact page body:
// <title>, font link, <style> and the inline module script, without the
// document skeleton (the Artifact host adds it).
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-single/index.html', 'utf8');
const pick = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const out = [
  '<title>JARVIS</title>',
  pick(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/g),
  pick(/<style[\s\S]*?<\/style>/g),
  '<div id="root"></div>',
  pick(/<script type="module"[\s\S]*?<\/script>/g),
].join('\n');
// A bundled library has a literal U+FFFD inside a JS string; escape it.
writeFileSync('dist-single/jarvis.html', out.replace(/\uFFFD/g, '\\uFFFD'));
console.log(`dist-single/jarvis.html ${(out.length / 1024).toFixed(0)} KB`);
