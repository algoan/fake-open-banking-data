/**
 * Auto generated thanks to https://jvilk.com/MakeTypes/
 */

export interface Sample {
  accounts: AccountsEntity[];
}

export interface Owner {
  name: string;
}

export interface AccountsEntity {
  balance: number;
  balanceDate: string;
  bank: Bank;
  currency: string;
  transactions: TransactionsEntity[];
  type: string;
  usage: string;
  number?: string;
  owners: Owner[];
  iban?: string;
  name?: string;
  bic?: string;
}

export interface Bank {
  name: string;
}

export interface TransactionsEntity {
  currency: string;
  dates: Dates;
  description: string;
  amount: number;
}

export interface Dates {
  debitedAt?: string;
  bookedAt?: string;
}

export interface FileEntity {
  filename: string;
  sample: Sample;
}

/**
 * A single line of a bank statement.
 */
export interface StatementLine {
  date: string;
  description: string;
  amount: number;
}

/**
 * The period a statement covers. Both bounds are clamped to the data actually
 * available for the account, so a partial first or last month stays truthful.
 */
export interface StatementPeriod {
  month: string;
  start: string;
  end: string;
}

/**
 * Everything needed to draw one monthly statement for one account.
 */
export interface Statement {
  locale: string;
  persona: string;
  accountSlug: string;
  accountName: string;
  holders: string[];
  currency: string;
  iban?: string;
  bic?: string;
  period: StatementPeriod;
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  lines: StatementLine[];
}

/**
 * Bookkeeping for the daily job: which statements have been produced, for
 * which month, and from which content.
 */
export interface StatementManifest {
  generatedAt: string;
  statements: Record<string, { generatedFor: string; period: StatementPeriod; fingerprint: string }>;
}
