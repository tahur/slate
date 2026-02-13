import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET_FILES = [
    'src/lib/server/services/posting-engine.ts',
    'src/routes/(app)/invoices/new/+page.server.ts',
    'src/routes/(app)/invoices/[id]/+page.server.ts',
    'src/routes/(app)/payments/new/+page.server.ts',
    'src/routes/(app)/expenses/new/+page.server.ts',
    'src/routes/(app)/credit-notes/new/+page.server.ts'
];

const MONEY_ASSIGNMENT_REGEX =
    /(?:const|let)\s+([A-Za-z0-9_]*(?:amount|total|balance|debit|credit|cgst|sgst|igst|paid|subtotal|taxable)[A-Za-z0-9_]*)\s*=\s*([^;]+);/i;

const violations = [];

for (const relPath of TARGET_FILES) {
    const absPath = path.join(process.cwd(), relPath);
    const content = await fs.readFile(absPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNo = index + 1;

        if (line.includes('0.01') && !/MONEY_EPSILON\s*=\s*0\.01/.test(line)) {
            violations.push(
                `${relPath}:${lineNo} uses literal 0.01. Use MONEY_EPSILON instead.`
            );
        }

        const match = line.match(MONEY_ASSIGNMENT_REGEX);
        if (!match) return;

        const expression = match[2];
        const hasArithmetic = /[+\-*/]/.test(expression);
        if (!hasArithmetic) return;

        const isGuarded =
            expression.includes('round2(') ||
            expression.includes('addCurrency(') ||
            expression.includes('sql`');

        if (!isGuarded) {
            violations.push(
                `${relPath}:${lineNo} money arithmetic should use round2/addCurrency/sql helpers.`
            );
        }
    });
}

if (violations.length > 0) {
    console.error('Money math guardrail failed:\n');
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}

console.log('Money math guardrail passed.');
