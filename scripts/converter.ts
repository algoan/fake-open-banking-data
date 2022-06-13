import * as path from 'path';

import { readJSONFiles, writeJSONFiles } from '../lib/utils';
import { algoanAccountsToBIAccounts } from '../mappers/budgetInsightV20/accounts';
import { algoanAccountsToLinxoAccounts } from '../mappers/linxoDAV3/accounts';
import { FileEntity } from '../types';

const formats: string[] = ['BUDGET_INSIGHT_V2_0', 'LINXO_CONNECT_DIRECT_ACCOUNT_API_V3'];

/**
 * Convert an Algoan data sample to another format
 * @param format supported format
 * @param data data to convert
 */
function convertAlgoanToAnotherFormat(format: string, data: any) {
  const convertedSample: any = {
    format,
  };

  switch (format) {
    case 'BUDGET_INSIGHT_V2_0':
      convertedSample.connections = [];
      convertedSample.connections.push({
        accounts: data.accounts.map(algoanAccountsToBIAccounts()),
      });
      break;

    case 'LINXO_CONNECT_DIRECT_ACCOUNT_API_V3':
      convertedSample.connections = [];
      convertedSample.connections.push({
        accounts: data.accounts.map(algoanAccountsToLinxoAccounts()),
      });
      break;

    default:
      throw new Error(`${format} is an unknown format`);
  }

  return convertedSample;
}

(async () => {
  /**
   * Load JSON files
   */
  const sampleDirectoryPath: string = path.join(__dirname, '..', 'samples/fr/');
  const fileEntities: FileEntity[] = readJSONFiles(sampleDirectoryPath);
  const convertedFiles: FileEntity[] = [];

  for (const format of formats) {
    const dirPath: string = path.join(__dirname, '..', `${format.toLocaleLowerCase()}/fr`);
    /**
     * For each file, apply the proper translation depending on the format
     */
    fileEntities.forEach((filePath: FileEntity) => {
      const convertedSample = convertAlgoanToAnotherFormat(format, filePath.sample);

      convertedFiles.push({
        filename: filePath.filename,
        sample: convertedSample,
      });
    });

    /**
     * Save files
     */
    writeJSONFiles(convertedFiles, dirPath);
  }
})().catch((err: Error) => {
  console.error(err);

  process.exit(1);
});
