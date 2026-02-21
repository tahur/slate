import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const ALLOWED_DIRECT_TRANSACTION_PATHS = new Set([
    path.normalize('src/lib/server/platform/db/tx.ts')
]);

const failures = [];

async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(fullPath)));
            continue;
        }
        files.push(fullPath);
    }

    return files;
}

function lineNumberForIndex(text, index) {
    return text.slice(0, index).split('\n').length;
}

function pushViolation(relPath, line, message) {
    failures.push(`${relPath}:${line} - ${message}`);
}

const files = (await walk(SRC_DIR)).filter((filePath) => /\.(ts|js|mjs|cjs)$/i.test(filePath));

for (const absPath of files) {
    const relPath = path.relative(ROOT, absPath);
    const relNormalized = path.normalize(relPath);
    const content = await fs.readFile(absPath, 'utf8');

    if (!ALLOWED_DIRECT_TRANSACTION_PATHS.has(relNormalized)) {
        const directPattern = /\bdb\.transaction\s*\(/g;
        for (const match of content.matchAll(directPattern)) {
            pushViolation(
                relPath,
                lineNumberForIndex(content, match.index ?? 0),
                'Direct db.transaction usage is disallowed. Use runInTx from $lib/server/platform/db/tx.'
            );
        }
    }

}

if (failures.length > 0) {
    console.error('Transaction wrapper guard failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Transaction wrapper guard passed.');
