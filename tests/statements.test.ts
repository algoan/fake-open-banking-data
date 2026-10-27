import { deepStrictEqual, strictEqual, throws } from 'node:assert';
import { describe, it } from 'node:test';
import { buildAccountStatements, statementFileName } from '../lib/statements';
import { AccountsEntity, Statement, TransactionsEntity } from '../types';

/**
 * Build a transaction booked at noon UTC on a given day.
 * @param day Day, as YYYY-MM-DD
 * @param amount Signed amount
 */
function transaction(day: string, amount: number): TransactionsEntity {
  return { currency: 'EUR', dates: { bookedAt: `${day}T12:00:00.000Z` }, description: `OP ${day}`, amount };
}

/**
 * Build a checking account whose balance is stated on a given day.
 * @param balanceDay Day of the balance, as YYYY-MM-DD
 * @param balance Balance at that day
 * @param transactions Account history
 * @param overrides Any other field to set
 */
function account(
  balanceDay: string,
  balance: number,
  transactions: TransactionsEntity[],
  overrides: Partial<AccountsEntity> = {},
): AccountsEntity {
  return {
    balance,
    balanceDate: `${balanceDay}T12:00:00.000Z`,
    bank: { name: 'Algoan Demo' },
    currency: 'EUR',
    transactions,
    type: 'CHECKING',
    usage: 'PERSONAL',
    owners: [{ name: 'JANE DOE' }],
    name: 'Compte Courant 01',
    ...overrides,
  };
}

/**
 * Months the statements cover, in order.
 * @param statements Statements to read
 */
function months(statements: Statement[]): string[] {
  return statements.map(({ period }: Statement) => period.month);
}

describe('buildAccountStatements', () => {
  it('issues one statement per complete month, chaining the balances back from the stated one', () => {
    const statements: Statement[] = buildAccountStatements(
      account('2026-10-08', 1000, [
        transaction('2026-08-01', 500),
        transaction('2026-08-20', -100),
        transaction('2026-09-01', 2000),
        transaction('2026-09-30', -300),
        transaction('2026-10-05', -50),
      ]),
      'fr',
      'jane_doe',
    );

    deepStrictEqual(months(statements), ['2026-08', '2026-09']);
    strictEqual(statements[0].openingBalance, -1050);
    strictEqual(statements[0].closingBalance, -650);
    strictEqual(statements[1].openingBalance, -650);
    strictEqual(statements[1].closingBalance, 1050);
    strictEqual(statements[1].totalCredit, 2000);
    strictEqual(statements[1].totalDebit, 300);
  });

  it('leaves out a month the history does not cover from its first day', () => {
    const statements: Statement[] = buildAccountStatements(
      account('2026-10-08', 1000, [
        transaction('2026-08-15', 500),
        transaction('2026-09-01', 200),
        transaction('2026-09-30', -100),
        transaction('2026-10-02', -20),
      ]),
      'fr',
      'jane_doe',
    );

    deepStrictEqual(months(statements), ['2026-09']);
  });

  it('ignores transactions dated after the balance date', () => {
    const statements: Statement[] = buildAccountStatements(
      account('2026-10-08', -120, [transaction('2026-10-10', -200), transaction('2026-10-10', -19.99)], {
        type: 'CREDIT_CARD',
        name: 'Compte Carte de Crédit 01',
      }),
      'fr',
      'jane_doe',
    );

    strictEqual(statements.length, 1);
    strictEqual(statements[0].period.month, '2026-09');
    deepStrictEqual(statements[0].lines, []);
    strictEqual(statements[0].openingBalance, -120);
    strictEqual(statements[0].closingBalance, -120);
  });

  it('issues a balance-only statement for an account without any transaction', () => {
    const statements: Statement[] = buildAccountStatements(account('2026-10-08', 42, []), 'fr', 'jane_doe');

    strictEqual(statements.length, 1);
    strictEqual(statements[0].period.month, '2026-09');
    strictEqual(statements[0].period.start, '2026-09-01T12:00:00.000Z');
    strictEqual(statements[0].period.end, '2026-09-30T12:00:00.000Z');
    deepStrictEqual(statements[0].lines, []);
    strictEqual(statements[0].closingBalance, 42);
  });

  it('takes the balance-only statement back from what was booked after its month', () => {
    const statements: Statement[] = buildAccountStatements(
      account('2026-10-08', 100, [transaction('2026-10-03', 30), transaction('2026-10-06', -10)]),
      'fr',
      'jane_doe',
    );

    deepStrictEqual(months(statements), ['2026-09']);
    strictEqual(statements[0].openingBalance, 80);
    strictEqual(statements[0].closingBalance, 80);
  });

  it('issues no balance-only statement for a month that holds transactions', () => {
    const statements: Statement[] = buildAccountStatements(
      account('2026-10-08', 100, [transaction('2026-09-15', 50), transaction('2026-10-02', -10)]),
      'fr',
      'jane_doe',
    );

    deepStrictEqual(statements, []);
  });

  it('rejects a transaction without any date', () => {
    const undated: TransactionsEntity = { currency: 'EUR', dates: {}, description: 'LOYER', amount: -700 };

    throws(
      () => buildAccountStatements(account('2026-10-08', 0, [undated]), 'fr', 'jane_doe'),
      /fr\/jane_doe: transaction "LOYER"/,
    );
  });

  it('names an unnamed account in the language of its locale', () => {
    const unnamed: AccountsEntity = account('2026-10-08', 0, [], { name: undefined });

    strictEqual(buildAccountStatements(unnamed, 'fr', 'jane_doe')[0].accountName, 'Compte');
    strictEqual(buildAccountStatements(unnamed, 'es', 'jane_doe')[0].accountName, 'Cuenta');
    strictEqual(buildAccountStatements(unnamed, 'nl', 'jane_doe')[0].accountSlug, 'rekening');
  });
});

describe('statementFileName', () => {
  it('carries the locale, the persona, the account and the month', () => {
    const [statement]: Statement[] = buildAccountStatements(account('2026-10-08', 0, []), 'be-nl', 'dana_scully');

    strictEqual(statementFileName(statement), 'be-nl_dana_scully_compte-courant-01_2026-09.pdf');
  });
});
