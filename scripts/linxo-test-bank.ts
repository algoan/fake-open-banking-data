import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { ensureDir, readJSONFiles } from '../lib/utils';
import { getTextStringFromAcc } from '../mappers/linxoV2/accounts';
import { FileEntity } from '../types';

(async function () {
  /**
   * Load JSON files
   */
  const sampleDirectoryPath: string = path.join(__dirname, '..', 'samples/');
  const fileEntities: FileEntity[] = readJSONFiles(sampleDirectoryPath);

  for (const file of fileEntities) {
    const txtStr: string = await getTextStringFromAcc(file.sample.accounts);
    const newFileName: string = file.filename.replace('.json', '.txt');
    const newFilePath: string = path.join(__dirname, '..', 'raw-data/linxo_test_bank/', newFileName);

    ensureDir(newFilePath);
    writeFileSync(newFilePath, txtStr);
  }
})();
