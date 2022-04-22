import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import { FileEntity } from '../types';

/**
 * Read the samples directory and return an array of samples
 * @param dirPath Sample directory path
 */
export function readJSONFiles(dirPath: string): FileEntity[] {
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
export function writeJSONFiles(fileEntities: FileEntity[], dirPath: string): void {
  fileEntities.forEach((fileEntity: FileEntity) => {
    writeFileSync(`${dirPath}/${fileEntity.filename}`, JSON.stringify(fileEntity.sample, null, 2));
  });
}