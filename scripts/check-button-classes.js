import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve("src");

const buttonTag = /<Button\b([^>]*)>/gs;
const classAttr = /class\s*=\s*"([^"]*)"/;
const disallowed = /(?:^|\s)(?:bg-(?:brand|primary|secondary|destructive|slate|gray|zinc|red|green|amber|blue|surface|card|muted)|text-(?:primary|secondary|destructive|white|black|slate|gray|zinc|red|green|amber|blue|text-|muted|foreground)|hover:(?:bg|text)-|border-(?:primary|secondary|destructive|slate|gray|zinc|red|green|amber|blue|border|input)|ring-)/;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && full.endsWith(".svelte")) {
      files.push(full);
    }
  }
  return files;
}

function getLineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

const files = await walk(ROOT_DIR);
const violations = [];

for (const file of files) {
  const content = await fs.readFile(file, "utf8");
  for (const match of content.matchAll(buttonTag)) {
    const attrs = match[1];
    const classMatch = classAttr.exec(attrs);
    if (!classMatch) continue;
    const classValue = classMatch[1];
    if (!disallowed.test(classValue)) continue;
    const line = getLineNumber(content, match.index ?? 0);
    violations.push({ file, line, classValue });
  }
}

if (violations.length) {
  console.error("Found disallowed Button color classes:");
  for (const v of violations) {
    const rel = path.relative(process.cwd(), v.file);
    console.error(`- ${rel}:${v.line} -> ${v.classValue}`);
  }
  process.exit(1);
}

console.log("Button class check passed.");
