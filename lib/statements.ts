import { AccountsEntity, Sample, Statement, StatementLine, TransactionsEntity } from '../types';

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
 * Round an amount to cents.
 * @param amount Amount to round
 */
function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Number of days in a month.
 * @param month Month, as YYYY-MM
 */
function daysIn(month: string): number {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
}

/**
 * The last month that had ended by a given date.
 * @param date Reference date
 */
function lastCompleteMonth(date: string): string {
  const month: string = date.slice(0, 7);
  if (Number(date.slice(8, 10)) >= daysIn(month)) {
    return month;
  }

  const previous: Date = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1));

  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
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
 * Build the monthly statements of a single account, keeping only the months its
 * history covers from the first to the last day. An account whose history holds
 * no transaction up to its balance date gets a single balance-only statement.
 * @param account Account to build statements for
 * @param locale Locale directory the persona lives in
 * @param persona Persona file name, without its extension
 */
export function buildAccountStatements(account: AccountsEntity, locale: string, persona: string): Statement[] {
  const undated: TransactionsEntity | undefined = account.transactions.find(
    (transaction: TransactionsEntity) =>
      transaction.dates?.debitedAt === undefined && transaction.dates?.bookedAt === undefined,
  );
  if (undated !== undefined) {
    throw new Error(
      `${locale}/${persona}: transaction "${undated.description}" of account "${
        account.name ?? account.number
      }" has neither debitedAt nor bookedAt`,
    );
  }

  /**
   * `account.balance` is the balance at `account.balanceDate`, so anything dated
   * after it has not reached the account yet. Such transactions are left out:
   * counting them would shift the reconstructed opening balance of every month
   * of the history.
   */
  const transactions: TransactionsEntity[] = account.transactions
    .filter(
      (transaction: TransactionsEntity) => Date.parse(transactionDate(transaction)) <= Date.parse(account.balanceDate),
    )
    .sort((a: TransactionsEntity, b: TransactionsEntity) => transactionDate(a).localeCompare(transactionDate(b)));

  const accountSlug: string = slugify(account.name ?? account.number ?? 'compte');
  const holders: string[] = (account.owners ?? []).map((owner: { name: string }) => owner.name).filter(Boolean);
  const identity = {
    locale,
    persona,
    accountSlug,
    accountName: account.name ?? account.number ?? 'Compte',
    holders,
    currency: account.currency,
    iban: account.iban,
    bic: account.bic,
  };

  /**
   * The fallback for an account no complete month can be drawn from, either
   * because it holds no transaction at all or because its history covers no
   * month end to end: the balance never moved over the last complete month, so
   * that month opens and closes on the balance the sample states.
   */
  const balanceOnly = (): Statement => {
    const month: string = lastCompleteMonth(account.balanceDate);

    return {
      ...identity,
      period: {
        month,
        start: `${month}-01T12:00:00.000Z`,
        end: `${month}-${String(daysIn(month)).padStart(2, '0')}T12:00:00.000Z`,
      },
      openingBalance: account.balance,
      closingBalance: account.balance,
      totalCredit: 0,
      totalDebit: 0,
      lines: [],
    };
  };

  if (transactions.length === 0) {
    return [balanceOnly()];
  }

  const total: number = transactions.reduce((acc: number, t: TransactionsEntity) => acc + t.amount, 0);
  let running: number = round(account.balance - total);

  const firstDate: string = transactionDate(transactions[0]);

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

  const statements: Statement[] = months.map((month: string) => {
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

    const lastDay: number = daysIn(month);
    const monthStart: string = `${month}-01T12:00:00.000Z`;
    const monthEnd: string = `${month}-${String(lastDay).padStart(2, '0')}T12:00:00.000Z`;
    const firstOfMonth: string = transactionDate(monthTransactions[0]);
    const lastOfMonth: string = transactionDate(monthTransactions[monthTransactions.length - 1]);

    const start: string = earlier(later(monthStart, firstDate), firstOfMonth);
    const end: string = later(earlier(monthEnd, account.balanceDate), lastOfMonth);

    return {
      ...identity,
      period: { month, start, end },
      openingBalance,
      closingBalance: running,
      totalCredit,
      totalDebit,
      lines,
    };
  });

  const complete: Statement[] = statements.filter(
    ({ period }: Statement) =>
      period.start.slice(8, 10) === '01' &&
      period.end.slice(0, 10) === `${period.month}-${String(daysIn(period.month)).padStart(2, '0')}`,
  );

  return complete.length > 0 ? complete : [balanceOnly()];
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
 * @param statement Statement to name
 */
export function statementPath(statement: Statement): string {
  return `${statement.locale}/${statement.persona}/${statement.accountSlug}_${statement.period.month}.pdf`;
}
