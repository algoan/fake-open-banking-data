import { getTextStringFromAcc } from '../mappers/linxoV2/accounts';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { FileEntity } from '../types';
import { readJSONFiles } from '../lib/utils';

(async function () {
  /**
   * Load JSON files
   */
  const sampleDirectoryPath: string = path.join(__dirname, '..', 'samples/fr/');
  const fileEntities: FileEntity[] = readJSONFiles(sampleDirectoryPath);

  for (const file of fileEntities) {
    const txtStr: string = await getTextStringFromAcc(file.sample.accounts);
    const newFileName: string = file.filename.replace('.json', '.txt');
    writeFileSync(path.join(__dirname, '..', 'linxo_test_bank/', newFileName), txtStr);
  }
})();
