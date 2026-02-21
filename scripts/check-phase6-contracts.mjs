import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

async function readText(relPath) {
    return fsp.readFile(path.join(projectRoot, relPath), 'utf8');
}

function findExportedFunction(mod, fnName) {
    return Object.values(mod).find((value) => typeof value === 'function' && value.name === fnName);
}

function requireFunction(mod, fnName, modulePath) {
    const fn = findExportedFunction(mod, fnName);
    if (!fn) {
        throw new Error(`Function "${fnName}" not found in ${modulePath}`);
    }
    return fn;
}

function requireClass(mod, className, modulePath) {
    const klass = Object.values(mod).find(
        (value) => typeof value === 'function' && value.name === className
    );
    if (!klass) {
        throw new Error(`Class "${className}" not found in ${modulePath}`);
    }
    return klass;
}

function assertMapped(result, expectedStatus, expectedCode, label) {
    assertCondition(result.status === expectedStatus, `${label}: expected status ${expectedStatus}, got ${result.status}`);
    assertCondition(
        result.payload?.code === expectedCode,
        `${label}: expected code ${expectedCode}, got ${result.payload?.code}`
    );
    assertCondition(
        typeof result.payload?.traceId === 'string' && result.payload.traceId.length > 0,
        `${label}: missing traceId`
    );
    assertCondition(
        typeof result.payload?.message === 'string' && result.payload.message.length > 0,
        `${label}: missing message`
    );
}

function assertThrowsValidation(fn, label) {
    try {
        fn();
        failures.push(`${label}: expected ValidationError, but no error was thrown`);
    } catch (error) {
        const err = /** @type {{ name?: string; message?: string }} */ (error);
        assertCondition(err.name === 'ValidationError', `${label}: expected ValidationError, got ${err.name}`);
    }
}

async function runStaticChecks() {
    const requiredActionFiles = [
        'src/routes/(app)/invoices/new/+page.server.ts',
        'src/routes/(app)/invoices/[id]/+page.server.ts',
        'src/routes/(app)/payments/new/+page.server.ts',
        'src/routes/(app)/credit-notes/new/+page.server.ts',
        'src/routes/(app)/expenses/new/+page.server.ts',
        'src/routes/setup/+page.server.ts',
        'src/routes/(app)/settings/+page.server.ts'
    ];

    for (const relPath of requiredActionFiles) {
        const content = await readText(relPath);
        assertCondition(
            content.includes('failActionFromError('),
            `Missing failActionFromError usage in ${relPath}`
        );
    }

    const requiredApiFiles = [
        'src/routes/api/reports/gstr1/csv/+server.ts',
        'src/routes/api/reports/gstr1/json/+server.ts',
        'src/routes/api/reports/gstr1/pdf/+server.ts',
        'src/routes/api/reports/gstr3b/csv/+server.ts',
        'src/routes/api/reports/gstr3b/json/+server.ts',
        'src/routes/api/reports/gstr3b/pdf/+server.ts',
        'src/routes/api/customers/[id]/credits/+server.ts',
        'src/routes/api/customers/[id]/statement/+server.ts',
        'src/routes/api/invoices/[id]/pdf/+server.ts'
    ];

    for (const relPath of requiredApiFiles) {
        const content = await readText(relPath);
        assertCondition(content.includes('jsonFromError('), `Missing jsonFromError usage in ${relPath}`);
    }

    const appTypes = await readText('src/app.d.ts');
    assertCondition(/interface Error[\s\S]*code\?:\s*string/.test(appTypes), 'App.Error is missing optional code field');
    assertCondition(/interface Error[\s\S]*traceId\?:\s*string/.test(appTypes), 'App.Error is missing optional traceId field');

    const hooks = await readText('src/hooks.server.ts');
    assertCondition(hooks.includes('mapErrorToHttp'), 'hooks.server.ts must use mapErrorToHttp in handleError');
    assertCondition(hooks.includes('return mapped.payload'), 'hooks.server.ts must return mapped.payload');
    assertCondition(!hooks.includes('error.stack'), 'hooks.server.ts should not expose stack traces');

    const reportsModule = await readText('src/lib/server/modules/reporting/application/gst-reports.ts');
    assertCondition(
        reportsModule.includes('parseDateRangeQueryFromUrl'),
        'Missing parseDateRangeQueryFromUrl export in gst-reports module'
    );
    assertCondition(
        reportsModule.includes('parseGstr1CsvSectionFromUrl'),
        'Missing parseGstr1CsvSectionFromUrl export in gst-reports module'
    );
}

async function runRuntimeChecks() {
    if (!process.env.DATABASE_URL) {
        console.log('Phase 6 runtime checks skipped: DATABASE_URL is not configured');
        return;
    }

    const chunksDir = path.join(projectRoot, '.svelte-kit', 'output', 'server', 'chunks');
    if (!fs.existsSync(chunksDir)) {
        failures.push('Build output not found. Run `npm run build` before `npm run check:phase6`.');
        return;
    }

    const domainPath = path.join(chunksDir, 'domain.js');
    const httpPath = path.join(chunksDir, 'http.js');
    const gstReportsPath = path.join(chunksDir, 'gst-reports.js');

    for (const absPath of [domainPath, httpPath, gstReportsPath]) {
        if (!fs.existsSync(absPath)) {
            failures.push(`Missing build chunk required for phase 6 checks: ${absPath}`);
            return;
        }
    }

    let domainMod;
    let httpMod;
    let gstReportsMod;
    try {
        domainMod = await import(pathToFileURL(domainPath).href);
        httpMod = await import(pathToFileURL(httpPath).href);
        gstReportsMod = await import(pathToFileURL(gstReportsPath).href);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`Phase 6 runtime checks skipped: ${message}`);
        return;
    }

    const mapErrorToHttp = requireFunction(httpMod, 'mapErrorToHttp', httpPath);
    const ValidationError = requireClass(domainMod, 'ValidationError', domainPath);
    const InvariantError = requireClass(domainMod, 'InvariantError', domainPath);
    const ConflictError = requireClass(domainMod, 'ConflictError', domainPath);
    const NotFoundError = requireClass(domainMod, 'NotFoundError', domainPath);
    const UnauthorizedError = requireClass(domainMod, 'UnauthorizedError', domainPath);
    const ForbiddenError = requireClass(domainMod, 'ForbiddenError', domainPath);

    const traceId = 'trace-phase6';
    assertMapped(mapErrorToHttp(new ValidationError('bad input'), traceId), 400, 'VALIDATION_ERROR', 'ValidationError mapping');
    assertMapped(mapErrorToHttp(new InvariantError('bad state'), traceId), 422, 'INVARIANT_ERROR', 'InvariantError mapping');
    assertMapped(mapErrorToHttp(new ConflictError('conflict'), traceId), 409, 'CONFLICT_ERROR', 'ConflictError mapping');
    assertMapped(mapErrorToHttp(new NotFoundError('missing'), traceId), 404, 'NOT_FOUND', 'NotFoundError mapping');
    assertMapped(mapErrorToHttp(new UnauthorizedError(), traceId), 401, 'UNAUTHORIZED', 'UnauthorizedError mapping');
    assertMapped(mapErrorToHttp(new ForbiddenError(), traceId), 403, 'FORBIDDEN', 'ForbiddenError mapping');
    assertMapped(mapErrorToHttp({ status: 404 }, traceId), 404, 'NOT_FOUND', 'Http status passthrough mapping');
    assertMapped(mapErrorToHttp(new Error('boom'), traceId), 500, 'INTERNAL_ERROR', 'Unknown error mapping');

    const parseDateRangeQueryFromUrl = requireFunction(
        gstReportsMod,
        'parseDateRangeQueryFromUrl',
        gstReportsPath
    );
    const parseGstr1CsvSectionFromUrl = requireFunction(
        gstReportsMod,
        'parseGstr1CsvSectionFromUrl',
        gstReportsPath
    );

    const ordered = parseDateRangeQueryFromUrl(new URL('https://example.com/reports?from=2026-02-01&to=2026-02-28'));
    assertCondition(ordered.startDate === '2026-02-01', 'Date parser should keep valid start date');
    assertCondition(ordered.endDate === '2026-02-28', 'Date parser should keep valid end date');

    const swapped = parseDateRangeQueryFromUrl(new URL('https://example.com/reports?from=2026-03-15&to=2026-03-01'));
    assertCondition(swapped.startDate === '2026-03-01', 'Date parser should normalize inverted ranges (start)');
    assertCondition(swapped.endDate === '2026-03-15', 'Date parser should normalize inverted ranges (end)');

    const section = parseGstr1CsvSectionFromUrl(new URL('https://example.com/reports?section=B2B'));
    assertCondition(section === 'b2b', 'CSV section parser should normalize case');

    assertThrowsValidation(
        () => parseDateRangeQueryFromUrl(new URL('https://example.com/reports?from=2026/02/01&to=2026-02-28')),
        'Date parser invalid date format'
    );
    assertThrowsValidation(
        () => parseGstr1CsvSectionFromUrl(new URL('https://example.com/reports?section=invalid')),
        'CSV section parser invalid section'
    );
}

await runStaticChecks();
await runRuntimeChecks();

if (failures.length > 0) {
    console.error('Phase 6 contract checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 6 contract checks passed.');
