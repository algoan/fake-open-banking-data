import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import pdfmake = require('pdfmake');
import { readJSONFiles } from '../lib/utils';
import { buildSampleStatements, statementFileName } from '../lib/statements';
import { buildStatementDocument } from '../templates/statement';
import { FileEntity, Statement } from '../types';

const STATEMENTS_DIR: string = path.join(__dirname, '..', 'statements');
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
 * Render one statement to a PDF file.
 * @param statement Statement to render
 */
async function writeStatement(statement: Statement): Promise<void> {
  const buffer: Buffer = await pdfmake.createPdf(buildStatementDocument(statement)).getBuffer();
  writeFileSync(path.join(STATEMENTS_DIR, statementFileName(statement)), buffer);
}

/**
 * Main script: rebuild every statement from the current samples.
 */
(async () => {
  const startedAt: number = Date.now();
  console.log('Building Banque Algoan statements...');

  const fileEntities: FileEntity[] = readJSONFiles(path.join(__dirname, '..', 'samples/'));

  const statements: Statement[] = fileEntities.reduce((acc: Statement[], fileEntity: FileEntity) => {
    const [locale, filename]: string[] = fileEntity.filename.split('/');

    return [...acc, ...buildSampleStatements(fileEntity.sample, locale, filename.replace('.json', ''))];
  }, []);

  const names: Set<string> = new Set(statements.map(statementFileName));
  if (names.size !== statements.length) {
    throw new Error('Two statements share the same file name');
  }

  mkdirSync(STATEMENTS_DIR, { recursive: true });
  for (const file of readdirSync(STATEMENTS_DIR)) {
    if (file.endsWith('.pdf')) {
      rmSync(path.join(STATEMENTS_DIR, file));
    }
  }

  configureRenderer();
  for (const statement of statements) {
    await writeStatement(statement);
  }

  console.log(`${statements.length} statements written to statements/ in ${Date.now() - startedAt} ms`);
})().catch((err: Error) => {
  console.error(err);

  process.exit(1);
});
