import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import dayjs from 'dayjs';
import { ensureDir, readJSONFiles } from '../lib/utils';
import { buildSampleStatements, statementPath } from '../lib/statements';
import { buildStatementDocument } from '../templates/statement';
import { FileEntity, Statement, StatementManifest } from '../types';

const pdfmake = require('pdfmake');

const STATEMENTS_DIR: string = path.join(__dirname, '..', 'statements');
const MANIFEST_PATH: string = path.join(STATEMENTS_DIR, 'manifest.json');
const ROBOTO_DIR: string = path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto');

const FONTS = {
  Roboto: {
    normal: path.join(ROBOTO_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(ROBOTO_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(ROBOTO_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(ROBOTO_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

/**
 * Register the fonts and restrict what the renderer may read.
 */
function configureRenderer(): void {
  pdfmake.addFonts(FONTS);
  pdfmake.setLocalAccessPolicy((file: string) => path.resolve(file).startsWith(ROBOTO_DIR));
  pdfmake.setUrlAccessPolicy(() => false);
}

/**
 * Read the manifest left behind by the previous run, if any.
 */
function readManifest(): StatementManifest {
  if (!existsSync(MANIFEST_PATH)) {
    return { generatedAt: '', statements: {} };
  }

  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    console.warn(`Manifest unreadable, every statement will be rebuilt: ${(err as Error).message}`);

    return { generatedAt: '', statements: {} };
  }
}

/**
 * Decide whether a statement has to be produced again.
 * @param statement Statement to check
 * @param manifest Manifest of the previous run
 * @param currentMonth Month the job runs in, as YYYY-MM
 * @param force Rebuild everything, whatever the manifest says
 */
function isStale(statement: Statement, manifest: StatementManifest, currentMonth: string, force: boolean): boolean {
  if (force) {
    return true;
  }

  const relativePath: string = statementPath(statement);
  if (!existsSync(path.join(STATEMENTS_DIR, relativePath))) {
    return true;
  }

  return manifest.statements[relativePath]?.generatedFor !== currentMonth;
}

/**
 * Delete the statements the samples no longer produce, and any directory left
 * empty behind them.
 * @param expected Paths, relative to the statements directory, that the samples yield
 */
function pruneOrphans(expected: Set<string>): string[] {
  if (!existsSync(STATEMENTS_DIR)) {
    return [];
  }

  const removed: string[] = [];

  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute: string = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(absolute);
        if (readdirSync(absolute).length === 0) {
          rmdirSync(absolute);
        }
        continue;
      }

      if (!entry.name.endsWith('.pdf')) {
        continue;
      }

      const relative: string = path.relative(STATEMENTS_DIR, absolute).split(path.sep).join('/');
      if (!expected.has(relative)) {
        unlinkSync(absolute);
        removed.push(relative);
      }
    }
  };

  walk(STATEMENTS_DIR);

  return removed;
}

/**
 * Render one statement to a PDF file.
 * @param statement Statement to render
 */
async function writeStatement(statement: Statement): Promise<void> {
  const target: string = path.join(STATEMENTS_DIR, statementPath(statement));
  ensureDir(target);

  const buffer: Buffer = await pdfmake.createPdf(buildStatementDocument(statement)).getBuffer();
  writeFileSync(target, buffer);
}

/**
 * Main script: rebuild the statements that are missing or out of date.
 */
(async () => {
  const startedAt: number = Date.now();
  const force: boolean = process.argv.includes('--force');
  const currentMonth: string = dayjs().format('YYYY-MM');
  console.log(`Building Banque Algoan statements for ${currentMonth}${force ? ' (forced)' : ''}...`);

  const fileEntities: FileEntity[] = readJSONFiles(path.join(__dirname, '..', 'samples/'));

  const statements: Statement[] = fileEntities.reduce((acc: Statement[], fileEntity: FileEntity) => {
    const [locale, filename]: string[] = fileEntity.filename.split('/');

    return [...acc, ...buildSampleStatements(fileEntity.sample, locale, filename.replace('.json', ''))];
  }, []);

  const manifest: StatementManifest = readManifest();
  const outdated: Statement[] = statements.filter((statement: Statement) =>
    isStale(statement, manifest, currentMonth, force),
  );
  console.log(`${statements.length} statements expected, ${outdated.length} to (re)build`);

  configureRenderer();
  for (const statement of outdated) {
    await writeStatement(statement);
  }

  const removed: string[] = pruneOrphans(new Set(statements.map(statementPath)));
  if (removed.length > 0) {
    console.log(`${removed.length} statements no longer produced by the samples, removed`);
  }

  const next: StatementManifest = { generatedAt: new Date().toISOString(), statements: {} };
  for (const statement of statements) {
    const relativePath: string = statementPath(statement);
    next.statements[relativePath] = {
      generatedFor: outdated.includes(statement)
        ? currentMonth
        : manifest.statements[relativePath]?.generatedFor ?? currentMonth,
      period: statement.period,
    };
  }

  ensureDir(MANIFEST_PATH);
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);

  console.log(`Done in ${Date.now() - startedAt} ms`);
})().catch((err: Error) => {
  console.error(err);

  process.exit(1);
});
