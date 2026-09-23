import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { Statement, StatementLine } from '../types';
import { localeOf, money, shortDate, StatementLabels } from './locales';

const COLOURS = {
  ink: '#0f172a',
  muted: '#64748b',
  hairline: '#e2e8f0',
  band: '#f1f5f9',
  brand: '#1d4ed8',
  credit: '#047857',
  debit: '#b91c1c',
};

const LOGO: string = `data:image/png;base64,${readFileSync(path.join(__dirname, 'assets', 'algoan-logo.png')).toString(
  'base64',
)}`;

/**
 * Build the two balance boxes framing the statement.
 * @param statement Statement to render
 * @param tag BCP 47 tag
 * @param labels Labels of the statement locale
 */
function balanceBoxes(statement: Statement, tag: string, labels: StatementLabels): any {
  const box = (label: string, amount: number, strong: boolean): any => ({
    width: '*',
    margin: [0, 0, 0, 0],
    table: {
      widths: ['*'],
      body: [
        [{ text: label, style: 'boxLabel' }],
        [
          {
            text: money(amount, statement.currency, tag),
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
      box(labels.balanceOn(shortDate(statement.period.start, tag)), statement.openingBalance, false),
      { width: 16, text: '' },
      box(labels.balanceOn(shortDate(statement.period.end, tag)), statement.closingBalance, true),
    ],
    margin: [0, 0, 0, 18],
  };
}

/**
 * Build the transaction table.
 * @param statement Statement to render
 * @param tag BCP 47 tag
 * @param labels Labels of the statement locale
 */
function transactionTable(statement: Statement, tag: string, labels: StatementLabels): any {
  const header: any[] = [
    { text: labels.date, style: 'th' },
    { text: labels.description, style: 'th' },
    { text: labels.debit, style: 'thRight' },
    { text: labels.credit, style: 'thRight' },
  ];

  const rows: any[][] = statement.lines.map((line: StatementLine) => [
    { text: shortDate(line.date, tag), style: 'td' },
    { text: line.description, style: 'td' },
    {
      text: line.amount < 0 ? money(Math.abs(line.amount), statement.currency, tag) : '',
      style: 'tdRight',
      color: COLOURS.debit,
    },
    {
      text: line.amount > 0 ? money(line.amount, statement.currency, tag) : '',
      style: 'tdRight',
      color: COLOURS.credit,
    },
  ]);

  const empty: any[][] = [[{ text: labels.noOperations, style: 'td', colSpan: 4, color: COLOURS.muted }, {}, {}, {}]];

  const totals: any[] = [
    { text: '', border: [false, true, false, false] },
    { text: labels.total, style: 'tdTotal', border: [false, true, false, false] },
    {
      text: money(statement.totalDebit, statement.currency, tag),
      style: 'tdTotalRight',
      color: COLOURS.debit,
      border: [false, true, false, false],
    },
    {
      text: money(statement.totalCredit, statement.currency, tag),
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
  const { tag, labels } = localeOf(statement.locale);
  const holders: string = statement.holders.join(` ${labels.and} `);

  return {
    pageSize: 'A4',
    pageMargins: [48, 104, 48, 64],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLOURS.ink, lineHeight: 1.15 },

    header: () => ({
      margin: [48, 36, 48, 0],
      columns: [
        { width: 78, image: LOGO, margin: [0, 0, 0, 0] },
        { width: '*', margin: [14, 9, 0, 0], text: labels.bankName, style: 'bankName' },
        {
          width: 'auto',
          stack: [
            { text: labels.documentTitle, style: 'docTitle' },
            {
              text: labels.period(shortDate(statement.period.start, tag), shortDate(statement.period.end, tag)),
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
          text: `${labels.bankName} — ${labels.disclaimer}`,
          style: 'footer',
        },
        { width: 'auto', text: labels.page(currentPage, pageCount), style: 'footer', alignment: 'right' },
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
              { text: labels.holder, style: 'blockLabel' },
              { text: holders, style: 'blockValueStrong' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: labels.account, style: 'blockLabel', alignment: 'right' },
              { text: statement.accountName, style: 'blockValueStrong', alignment: 'right' },
              { text: statement.iban ? `IBAN ${statement.iban}` : '', style: 'blockValue', alignment: 'right' },
              { text: statement.bic ? `BIC ${statement.bic}` : '', style: 'blockValue', alignment: 'right' },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      balanceBoxes(statement, tag, labels),
      transactionTable(statement, tag, labels),
    ],

    styles: {
      bankName: { fontSize: 13, bold: true, color: COLOURS.brand },
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
