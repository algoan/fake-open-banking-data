import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { Statement, StatementLine } from '../types';

const COLOURS = {
  ink: '#0f172a',
  muted: '#64748b',
  hairline: '#e2e8f0',
  band: '#f1f5f9',
  brand: '#1d4ed8',
  credit: '#047857',
  debit: '#b91c1c',
};

const BANK_NAME: string = 'Banque Algoan';
const BANK_ADDRESS: string[] = ['24 rue de Clichy', '75009 Paris', 'France'];

const LOGO: string = `data:image/png;base64,${readFileSync(path.join(__dirname, 'assets', 'algoan-logo.png')).toString(
  'base64',
)}`;

/**
 * Format an amount the French way: thousands separated by a no-break space, two
 * decimals, comma as the decimal mark.
 * @param amount Amount to format
 * @param currency ISO currency code
 */
function money(amount: number, currency: string): string {
  const symbol: string = currency === 'EUR' ? '€' : currency;
  const [whole, cents]: string[] = Math.abs(amount).toFixed(2).split('.');
  const grouped: string = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${amount < 0 ? '-' : ''}${grouped},${cents} ${symbol}`;
}

/**
 * Render a date as DD/MM/YYYY.
 * @param isoDate ISO date string
 */
function shortDate(isoDate: string): string {
  const [year, month, day]: string[] = isoDate.slice(0, 10).split('-');

  return `${day}/${month}/${year}`;
}

/**
 * Build the two balance boxes framing the statement.
 * @param statement Statement to render
 */
function balanceBoxes(statement: Statement): any {
  const box = (label: string, amount: number, strong: boolean): any => ({
    width: '*',
    margin: [0, 0, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: label, style: 'boxLabel' }],
        [
          {
            text: money(amount, statement.currency),
            style: 'boxAmount',
            color: strong ? COLOURS.brand : COLOURS.ink,
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      fillColor: () => COLOURS.band,
      paddingLeft: () => 12,
      paddingRight: () => 12,
      paddingTop: (i: number) => (i === 0 ? 10 : 0),
      paddingBottom: (i: number) => (i === 0 ? 2 : 10),
    },
  });

  return {
    columns: [
      box(`Solde au ${shortDate(statement.period.start)}`, statement.openingBalance, false),
      { width: 16, text: '' },
      box(`Solde au ${shortDate(statement.period.end)}`, statement.closingBalance, true),
    ],
    margin: [0, 0, 0, 18],
  };
}

/**
 * Build the transaction table.
 * @param statement Statement to render
 */
function transactionTable(statement: Statement): any {
  const header: any[] = [
    { text: 'Date', style: 'th' },
    { text: 'Libellé', style: 'th' },
    { text: 'Débit', style: 'thRight' },
    { text: 'Crédit', style: 'thRight' },
  ];

  const rows: any[][] = statement.lines.map((line: StatementLine) => [
    { text: shortDate(line.date), style: 'td' },
    { text: line.description, style: 'td' },
    {
      text: line.amount < 0 ? money(Math.abs(line.amount), statement.currency) : '',
      style: 'tdRight',
      color: COLOURS.debit,
    },
    {
      text: line.amount > 0 ? money(line.amount, statement.currency) : '',
      style: 'tdRight',
      color: COLOURS.credit,
    },
  ]);

  const empty: any[][] = [
    [{ text: 'Aucune opération sur la période.', style: 'td', colSpan: 4, color: COLOURS.muted }, {}, {}, {}],
  ];

  const totals: any[] = [
    { text: '', border: [false, true, false, false] },
    { text: 'Total des opérations', style: 'tdTotal', border: [false, true, false, false] },
    {
      text: money(statement.totalDebit, statement.currency),
      style: 'tdTotalRight',
      color: COLOURS.debit,
      border: [false, true, false, false],
    },
    {
      text: money(statement.totalCredit, statement.currency),
      style: 'tdTotalRight',
      color: COLOURS.credit,
      border: [false, true, false, false],
    },
  ];

  return {
    table: {
      headerRows: 1,
      widths: [56, '*', 86, 86],
      body: [header, ...(rows.length > 0 ? rows : empty), totals],
    },
    layout: {
      hLineWidth: (i: number, node: any) => (i === 1 || i === node.table.body.length - 1 ? 0.8 : 0.5),
      vLineWidth: () => 0,
      hLineColor: (i: number, node: any) =>
        i === 1 || i === node.table.body.length - 1 ? COLOURS.ink : COLOURS.hairline,
      fillColor: (i: number) => (i === 0 ? COLOURS.band : null),
      paddingLeft: (i: number) => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
  };
}

/**
 * Turn a statement into a pdfmake document definition.
 * @param statement Statement data to render
 */
export function buildStatementDocument(statement: Statement): any {
  const holders: string = statement.holders.join(' et ');

  return {
    pageSize: 'A4',
    pageMargins: [48, 104, 48, 64],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLOURS.ink, lineHeight: 1.15 },

    header: () => ({
      margin: [48, 36, 48, 0],
      columns: [
        { width: 28, image: LOGO, margin: [0, 2, 0, 0] },
        {
          width: '*',
          margin: [9, 0, 0, 0],
          stack: [
            { text: BANK_NAME, style: 'bankName' },
            { text: BANK_ADDRESS.join(' · '), style: 'bankAddress' },
          ],
        },
        {
          width: 'auto',
          stack: [
            { text: 'RELEVÉ DE COMPTE', style: 'docTitle' },
            {
              text: `Période du ${shortDate(statement.period.start)} au ${shortDate(statement.period.end)}`,
              style: 'docSubtitle',
            },
          ],
        },
      ],
    }),

    footer: (currentPage: number, pageCount: number) => ({
      margin: [48, 12, 48, 0],
      columns: [
        {
          width: '*',
          text: `${BANK_NAME} — données fictives générées à des fins de test. Aucune valeur contractuelle.`,
          style: 'footer',
        },
        { width: 'auto', text: `Page ${currentPage} / ${pageCount}`, style: 'footer', alignment: 'right' },
      ],
    }),

    content: [
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 0.8, lineColor: COLOURS.brand }],
        margin: [0, 6, 0, 16],
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'TITULAIRE', style: 'blockLabel' },
              { text: holders, style: 'blockValueStrong' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'COMPTE', style: 'blockLabel', alignment: 'right' },
              { text: statement.accountName, style: 'blockValueStrong', alignment: 'right' },
              { text: statement.iban ? `IBAN ${statement.iban}` : '', style: 'blockValue', alignment: 'right' },
              { text: statement.bic ? `BIC ${statement.bic}` : '', style: 'blockValue', alignment: 'right' },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      balanceBoxes(statement),
      transactionTable(statement),
    ],

    styles: {
      bankName: { fontSize: 13, bold: true, color: COLOURS.brand },
      bankAddress: { fontSize: 7, color: COLOURS.muted },
      docTitle: { fontSize: 13, bold: true, characterSpacing: 0.6, alignment: 'right' },
      docSubtitle: { fontSize: 8, color: COLOURS.muted, alignment: 'right' },
      blockLabel: { fontSize: 7, bold: true, color: COLOURS.muted, characterSpacing: 0.8, margin: [0, 0, 0, 3] },
      blockValue: { fontSize: 8, color: COLOURS.muted },
      blockValueStrong: { fontSize: 10, bold: true },
      boxLabel: { fontSize: 7, bold: true, color: COLOURS.muted, characterSpacing: 0.6 },
      boxAmount: { fontSize: 15, bold: true },
      th: { fontSize: 7, bold: true, color: COLOURS.muted, characterSpacing: 0.6 },
      thRight: { fontSize: 7, bold: true, color: COLOURS.muted, characterSpacing: 0.6, alignment: 'right' },
      td: { fontSize: 8 },
      tdRight: { fontSize: 8, alignment: 'right' },
      tdTotal: { fontSize: 8, bold: true },
      tdTotalRight: { fontSize: 8, bold: true, alignment: 'right' },
      footer: { fontSize: 6.5, color: COLOURS.muted },
    },
  };
}
