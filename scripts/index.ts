import dayjs from 'dayjs';
import * as path from 'path';
import { readJSONFiles, writeJSONFiles } from '../lib/utils';

import { AccountsEntity, FileEntity, Sample, TransactionsEntity } from '../types';

/**
 * Transaction dates object
 */
interface TransactionDates {
  debitedAt?: string;
  bookedAt?: string;
}

/**
 * Add days to a date
 * @param date original date
 * @param nbOfDayToAdd number of days to add
 */
function addDays(date: string, nbOfDayToAdd: number): string {
  return dayjs(date).add(nbOfDayToAdd, 'day').toISOString();
}

/**
 * Transform the date object with updated dates
 * @param originalDates Original dates
 * @param nbOfDayToAdd number of days to add to dates
 */
function getDateObject(originalDates: TransactionDates, nbOfDayToAdd: number): TransactionDates {
  const updatedDates: TransactionDates = {};
  updatedDates.bookedAt = originalDates.bookedAt ? addDays(originalDates.bookedAt, nbOfDayToAdd) : undefined;
  updatedDates.debitedAt = originalDates.debitedAt ? addDays(originalDates.debitedAt, nbOfDayToAdd) : undefined;

  return updatedDates;
}

/**
 * Update a transaction "debitedAt" property according to the number of days to add
 * @param transaction Transaction entity
 * @param nbOfDayToAdd Number of day to add
 */
function mapTransactions(nbOfDayToAdd: number) {
  return (transaction: TransactionsEntity) => ({
    ...transaction,
    dates: getDateObject(transaction.dates, nbOfDayToAdd),
  });
}

/**
 * Update an account balance date and all of its transactions
 * @param account Account entity to update
 * @param nbOfDayToAdd Number of days to add
 */
function mapAccount(nbOfDayToAdd: number) {
  return (account: AccountsEntity) => ({
    ...account,
    balanceDate: dayjs(account.balanceDate).add(nbOfDayToAdd, 'day').toISOString(),
    transactions: account.transactions.map(mapTransactions(nbOfDayToAdd)),
  });
}

/**
 * Take a JSON account sample and refresh all account and transaction dates
 * @param sample
 */
export const refreshDates = (sample: Sample): Sample => {
  const balanceDateReference: dayjs.Dayjs = dayjs(sample.accounts[0].balanceDate);
  console.log(`Reference balance date: ${balanceDateReference}`);
  const nbOfDays: number = dayjs().diff(balanceDateReference, 'day');
  console.log(`Number of days since the last update has been done: ${nbOfDays}`);

  return {
    accounts: sample.accounts.map(mapAccount(nbOfDays)),
  };
};

/**
 * Main script
 */
(async () => {
  const startingDate: number = Date.now();
  console.log(`Starting the Script...`);

  const sampleDirectoryPath: string = path.join(__dirname, '..', 'samples/');

  const fileEntities: FileEntity[] = readJSONFiles(sampleDirectoryPath);
  console.log(`Successfully read all JSON files after ${Date.now() - startingDate} ms`);

  const refreshedSamples: FileEntity[] = fileEntities.map((fileEntity: FileEntity) => {
    return {
      ...fileEntity,
      sample: refreshDates(fileEntity.sample),
    };
  });

  writeJSONFiles(refreshedSamples, sampleDirectoryPath);
  console.log(`Successfully write all JSON files after ${Date.now() - startingDate} ms`);
})().catch((err: Error) => {
  console.error(err);

  process.exit(1);
});
