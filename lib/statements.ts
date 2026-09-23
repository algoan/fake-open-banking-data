import { AccountsEntity, Sample, Statement, StatementLine, TransactionsEntity } from '../types';

/**
 * Combining marks left behind by an NFD normalisation. Built from a string
 * rather than written as a regular expression literal, so that the escapes stay
 * readable instead of being folded into invisible characters by the formatter.
 */
const DIACRITICS: RegExp = new RegExp('[̀-ͯ]', 'g');

/**
 * Turn a label into a file-name friendly slug.
 * @param value Label to slugify
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The date a transaction hits the account.
 * @param transaction Transaction entity
 */
function transactionDate(transaction: TransactionsEntity): string {
  return (transaction.dates.debitedAt ?? transaction.dates.bookedAt) as string;
}

/**
 * Round to cents, so that walking a balance never drifts on floating point.
 * @param amount Amount to round
 */
function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * The earlier of two dates.
 * @param a First date
 * @param b Second date
 */
function earlier(a: string, b: string): string {
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

/**
 * The later of two dates.
 * @param a First date
 * @param b Second date
 */
function later(a: string, b: string): string {
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

/**
 * Build every monthly statement of a single account.
 *
 * The samples only carry the balance at `balanceDate`, so the opening balance of
 * the whole history is rebuilt by subtracting every transaction from it. The
 * running balance is then walked forward, month by month: each statement closes
 * on the balance the next one opens with.
 *
 * @param account Account to build statements for
 * @param locale Locale directory the persona lives in
 * @param persona Persona file name, without its extension
 */
export function buildAccountStatements(account: AccountsEntity, locale: string, persona: string): Statement[] {
  const transactions: TransactionsEntity[] = [...account.transactions].sort(
    (a: TransactionsEntity, b: TransactionsEntity) => transactionDate(a).localeCompare(transactionDate(b)),
  );

  if (transactions.length === 0) {
    return [];
  }

  const total: number = transactions.reduce((acc: number, t: TransactionsEntity) => acc + t.amount, 0);
  let running: number = round(account.balance - total);

  const firstDate: string = transactionDate(transactions[0]);
  const accountSlug: string = slugify(account.name ?? account.number ?? 'compte');
  const holders: string[] = (account.owners ?? []).map((owner: { name: string }) => owner.name).filter(Boolean);

  const months: string[] = [];
  const byMonth: Record<string, TransactionsEntity[]> = {};
  for (const transaction of transactions) {
    const month: string = transactionDate(transaction).slice(0, 7);
    if (byMonth[month] === undefined) {
      byMonth[month] = [];
      months.push(month);
    }
    byMonth[month].push(transaction);
  }

  return months.map((month: string) => {
    const monthTransactions: TransactionsEntity[] = byMonth[month];
    const openingBalance: number = running;

    let totalCredit: number = 0;
    let totalDebit: number = 0;
    const lines: StatementLine[] = monthTransactions.map((transaction: TransactionsEntity) => {
      running = round(running + transaction.amount);
      if (transaction.amount >= 0) {
        totalCredit = round(totalCredit + transaction.amount);
      } else {
        totalDebit = round(totalDebit + Math.abs(transaction.amount));
      }

      return {
        date: transactionDate(transaction),
        description: transaction.description,
        amount: transaction.amount,
      };
    });

    /**
     * A statement covers a calendar month, clamped to the data we actually hold:
     * it never claims to start before the first transaction, nor to run past the
     * balance date. The bounds are then widened back to the transactions the
     * statement lists, so that a sample whose transactions fall outside its own
     * balance date still gets a period that contains them.
     */
    const lastDay: number = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    const monthStart: string = `${month}-01T12:00:00.000Z`;
    const monthEnd: string = `${month}-${String(lastDay).padStart(2, '0')}T12:00:00.000Z`;
    const firstOfMonth: string = transactionDate(monthTransactions[0]);
    const lastOfMonth: string = transactionDate(monthTransactions[monthTransactions.length - 1]);

    const start: string = earlier(later(monthStart, firstDate), firstOfMonth);
    const end: string = later(earlier(monthEnd, account.balanceDate), lastOfMonth);

    return {
      locale,
      persona,
      accountSlug,
      accountName: account.name ?? account.number ?? 'Compte',
      holders,
      currency: account.currency,
      iban: account.iban,
      bic: account.bic,
      period: { month, start, end },
      openingBalance,
      closingBalance: running,
      totalCredit,
      totalDebit,
      lines,
    };
  });
}

/**
 * Build every monthly statement of every account of a persona.
 * @param sample Persona sample
 * @param locale Locale directory the persona lives in
 * @param persona Persona file name, without its extension
 */
export function buildSampleStatements(sample: Sample, locale: string, persona: string): Statement[] {
  return sample.accounts.reduce(
    (acc: Statement[], account: AccountsEntity) => [...acc, ...buildAccountStatements(account, locale, persona)],
    [],
  );
}

/**
 * Path of the PDF a statement is written to, relative to the statements directory.
 * The month is part of the name, so a new month simply shows up as a missing file.
 * @param statement Statement to name
 */
export function statementPath(statement: Statement): string {
  return `${statement.locale}/${statement.persona}/${statement.accountSlug}_${statement.period.month}.pdf`;
}
