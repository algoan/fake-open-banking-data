import { makeId } from '../../lib/utils';

/**
 * Map function to convert an Algoan Account to BI format
 */
export const algoanAccountsToLinxoAccounts = (): any => {
  return (account: any) => ({
    transactions: account.transactions.map(algoanTransactions()),
    name: account.name ?? `Compte ${account.type} de ${account.owners[0]?.name ?? 'test'}`,
    balances: [
      {
        balance_amount: {
          currency: account.currency,
          amount: account.balance.toString(),
        },
        reference_date: account.balanceDate,
      },
    ],
    currency: account.currency,
    type: getLinxoType(account.type),
    usage: getLinxoUsage(account.usage),
    account_id: makeId(15),
    iban: account.iban,
  });
};

/**
 * Map function to convert an Algoan Account to BI format
 */
export const algoanTransactions = (): any => {
  return (transaction: any) => {
    return {
      transaction_amount: {
        currency: transaction.currency,
        amount: transaction.amount.toString(),
      },
      booking_date: transaction.dates.debitedAt,
      transaction_date: transaction.dates.bookedAt,
      remittance_information: [transaction.description],
      id: makeId(15),
    };
  };
};

/**
 * Get Budget Insight account type
 * @param accountType Algoan type
 */
function getLinxoType(accountType: string) {
  switch (accountType) {
    case 'CHECKING':
      return 'CASH_ACCOUNT';

    case 'SAVINGS':
      return 'SAVING';

    case 'LOAN':
      return 'LOAN';

    case 'CREDIT_CARD':
      return 'CARD';

    default:
      return 'unknown';
  }
}

/**
 * Get Budget Insight account usage
 * @param usage Algoan usage
 */
function getLinxoUsage(usage: string) {
  switch (usage) {
    case 'PERSONAL':
      return 'PRIVATE';

    case 'PROFESSIONAL':
      return 'ORGANISATION';

    default:
      return 'PRIVATE';
  }
}
