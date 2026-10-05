export interface StatementLabels {
  bankName: string;
  documentTitle: string;
  period: (start: string, end: string) => string;
  holder: string;
  account: string;
  balanceOn: (date: string) => string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  noOperations: string;
  total: string;
  and: string;
  disclaimer: string;
  page: (current: number, count: number) => string;
}

const FRENCH: StatementLabels = {
  bankName: 'Banque Algoan',
  documentTitle: 'RELEVÉ DE COMPTE',
  period: (start: string, end: string) => `Période du ${start} au ${end}`,
  holder: 'TITULAIRE',
  account: 'COMPTE',
  balanceOn: (date: string) => `Solde au ${date}`,
  date: 'Date',
  description: 'Libellé',
  debit: 'Débit',
  credit: 'Crédit',
  noOperations: 'Aucune opération sur la période.',
  total: 'Total des opérations',
  and: 'et',
  disclaimer: 'données fictives générées à des fins de test. Aucune valeur contractuelle.',
  page: (current: number, count: number) => `Page ${current} / ${count}`,
};

const ENGLISH: StatementLabels = {
  bankName: 'Algoan Bank',
  documentTitle: 'ACCOUNT STATEMENT',
  period: (start: string, end: string) => `Period from ${start} to ${end}`,
  holder: 'ACCOUNT HOLDER',
  account: 'ACCOUNT',
  balanceOn: (date: string) => `Balance on ${date}`,
  date: 'Date',
  description: 'Description',
  debit: 'Debit',
  credit: 'Credit',
  noOperations: 'No transactions during this period.',
  total: 'Total transactions',
  and: 'and',
  disclaimer: 'fictitious data generated for testing purposes. Not a contractual document.',
  page: (current: number, count: number) => `Page ${current} / ${count}`,
};

const SPANISH: StatementLabels = {
  bankName: 'Banco Algoan',
  documentTitle: 'EXTRACTO DE CUENTA',
  period: (start: string, end: string) => `Período del ${start} al ${end}`,
  holder: 'TITULAR',
  account: 'CUENTA',
  balanceOn: (date: string) => `Saldo a ${date}`,
  date: 'Fecha',
  description: 'Concepto',
  debit: 'Cargo',
  credit: 'Abono',
  noOperations: 'Sin operaciones en el período.',
  total: 'Total de operaciones',
  and: 'y',
  disclaimer: 'datos ficticios generados con fines de prueba. Sin valor contractual.',
  page: (current: number, count: number) => `Página ${current} / ${count}`,
};

const DUTCH: StatementLabels = {
  bankName: 'Algoan Bank',
  documentTitle: 'REKENINGAFSCHRIFT',
  period: (start: string, end: string) => `Periode van ${start} tot ${end}`,
  holder: 'REKENINGHOUDER',
  account: 'REKENING',
  balanceOn: (date: string) => `Saldo op ${date}`,
  date: 'Datum',
  description: 'Omschrijving',
  debit: 'Debet',
  credit: 'Credit',
  noOperations: 'Geen transacties in deze periode.',
  total: 'Totaal transacties',
  and: 'en',
  disclaimer: 'fictieve gegevens gegenereerd voor testdoeleinden. Geen contractuele waarde.',
  page: (current: number, count: number) => `Pagina ${current} / ${count}`,
};

const LOCALES: Record<string, { tag: string; labels: StatementLabels }> = {
  fr: { tag: 'fr-FR', labels: FRENCH },
  en: { tag: 'en-GB', labels: ENGLISH },
  es: { tag: 'es-ES', labels: SPANISH },
  nl: { tag: 'nl-NL', labels: DUTCH },
  'be-fr': { tag: 'fr-BE', labels: FRENCH },
  'be-nl': { tag: 'nl-BE', labels: DUTCH },
};

const FALLBACK = LOCALES.en;

/**
 * The labels and the BCP 47 tag a sample directory is written in.
 * @param locale Sample directory name, such as `fr` or `be-nl`
 */
export function localeOf(locale: string): { tag: string; labels: StatementLabels } {
  return LOCALES[locale] ?? FALLBACK;
}

/**
 * Format an amount in the conventions of a locale.
 * @param amount Amount to format
 * @param currency ISO currency code
 * @param tag BCP 47 tag
 */
export function money(amount: number, currency: string, tag: string): string {
  const formatted: string = new Intl.NumberFormat(tag, { style: 'currency', currency }).format(amount);

  return formatted.replace(/ /g, ' ');
}

/**
 * Format a date in the conventions of a locale.
 * @param isoDate ISO date string
 * @param tag BCP 47 tag
 */
export function shortDate(isoDate: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoDate));
}
