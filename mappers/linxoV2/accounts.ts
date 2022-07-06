import { makeid } from '../../lib/utils';

export async function getTextStringFromAcc(accounts: any) {
  let txtStr: string = 'CREDENTIALS|dev@algoan.com|password\n';

  for (const account of accounts) {
    const accountId: string = makeid(12);
    txtStr += `ACCOUNT|${accountId}|${account.number}|${account.balanceDate}|${account.balance}|${getAccountType(account.type)}|||${account.owners[0].name}|||||EUR|||||PERSONAL\n`;
    txtStr += getTransactionStr(account.transactions);
  }

  return txtStr;
}

function getAccountType(type: string): string {
  switch (type) {
    case 'CHECKING':
      return 'Checkings';

    case 'SAVINGS':
      return 'Savings';

    case 'LOAN':
      return 'Loans';

    case 'CREDIT_CARD':
      return 'CreditCard';

    default:
      return 'unknown';
  }
}

function getTransactionStr(transactions: any): string {
  let result: string = '';
  for (const transaction of transactions) {
    result += `TRANSACTION|${transaction.amount}|${transaction.dates.debitedAt}|${transaction.description}\n`;
  }

  return result;
}