/**
 * Map function to convert an Algoan Account to BI format
 */
export const algoanAccountsToBIAccounts = (): any => {
  return (account: any) => ({
    transactions: account.transactions.map(algoanTransactions()),
    balance: account.balance,
    last_update: account.balanceDate,
    iban: account.iban,
    currency: {
      id: account.currency,
    },
    type: getBIType(account.type),
    usage: getBIUsage(account.usage),
    id: Math.floor(Math.random() * 1000),
  });
};

/**
 * Map function to convert an Algoan Account to BI format
 */
export const algoanTransactions = (): any => {
  return (transaction: any) => {
    return {
      date: transaction.dates.debitedAt,
      rdate: transaction.dates.bookedAt ?? transaction.dates.debitedAt,
      currency: transaction.currency,
      value: transaction.amount,
      original_wording: transaction.description,
      id: Math.floor(Math.random() * 1000),
    };
  };
};

/**
 * Get Budget Insight account type
 * @param accountType Algoan type
 */
function getBIType(accountType: string) {
  switch (accountType) {
    case 'CHECKING':
      return 'checking';

    case 'SAVINGS':
      return 'savings';

    case 'LOAN':
      return 'loan';

    case 'CREDIT_CARD':
      return 'card';

    default:
      return 'unknown';
  }
}

/**
 * Get Budget Insight account usage
 * @param usage Algoan usage
 */
function getBIUsage(usage: string) {
  switch (usage) {
    case 'PERSONAL':
      return 'PRIV';

    case 'PROFESSIONAL':
      return 'ORGA';

    default:
      return 'ASSO';
  }
}
