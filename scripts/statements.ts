import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

/**
 * pdfmake ships Roboto, but without a Bold cut: Medium plays that role.
 */
const FONTS = {
  Roboto: {
    normal: path.join(ROBOTO_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(ROBOTO_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(ROBOTO_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(ROBOTO_DIR, 'Roboto-MediumItalic.ttf'),
  },
};

/**
 * Register the fonts, and pin down what the renderer may reach for: the bundled
 * Roboto files, and nothing else. The logo travels inside the template as a data
 * URI, so a statement never needs the network to be drawn.
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
 *
 * A statement is rebuilt when its PDF is missing, or when it was produced during
 * an earlier month: statements therefore all refresh on the first day of a month,
 * and stay untouched on every other day, which keeps the daily commit small.
 *
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

  /**
   * The manifest is rebuilt from the statements the data currently yields, so a
   * month that drops out of the samples also drops out of the manifest.
   */
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
