import dayjs from 'dayjs';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import { AccountsEntity, FileEntity, Sample, TransactionsEntity } from '../types';

/**
 * Update a transaction "debitedAt" property according to the number of days to add
 * @param transaction Transaction entity
 * @param nbOfDayToAdd Number of day to add
 */
function mapTransactions(nbOfDayToAdd: number) {
  return (transaction: TransactionsEntity) => ({
    ...transaction,
    dates: {
      debitedAt: dayjs(transaction.dates.debitedAt).add(nbOfDayToAdd, 'day').toISOString(),
    },
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
 * Read the samples directory and return an array of samples
 * @param dirPath Sample directory path
 */
function readJSONFiles(dirPath: string): FileEntity[] {
  const jsonsInDirectory: string[] = readdirSync(dirPath);
  const samples: FileEntity[] = [];

  jsonsInDirectory.forEach((filename: string) => {
    const sample: Buffer = readFileSync(path.join(dirPath, filename));

    samples.push({
      filename,
      sample: JSON.parse(sample.toString()),
    });
  });

  return samples;
}

/**
 * Rewrite JSON samples with the refresh data
 * @param fileEntities Refresh sample file with file names
 * @param dirPath Samples directory path
 */
function writeJSONFiles(fileEntities: FileEntity[], dirPath: string): void {
  fileEntities.forEach((fileEntity: FileEntity) => {
    writeFileSync(`${dirPath}/${fileEntity.filename}`, JSON.stringify(fileEntity.sample, null, 2));
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

  const sampleDirectoryPath: string = path.join(__dirname, '..', 'samples/fr/');

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
