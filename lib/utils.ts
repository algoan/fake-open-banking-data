import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

import { FileEntity } from '../types';

/**
 * Read the samples directory and return an array of samples
 * @param dirPath Sample directory path
 */
export function readJSONFiles(dirPath: string): FileEntity[] {
  /**
   * The sample directory contains language directories (en, fr)
   */
  const countriesDir: string[] = readdirSync(dirPath);
  const samples: FileEntity[] = [];
  /**
   * For each country, read JSON files and push it in an array
   */
  for (const country of countriesDir) {
    const filePath: string = `${dirPath}${country}`;
    const jsonsInDirectory: string[] = readdirSync(filePath);
    jsonsInDirectory.forEach((filename: string) => {
      const sample: Buffer = readFileSync(path.join(filePath, filename));
      const extension: string = filename.split('.')[1];

      if (extension !== 'json') {
        return;
      }

      samples.push({
        filename: `${country}/${filename}`,
        sample: JSON.parse(sample.toString()),
      });
    });
  }
  console.log(samples);
  return samples;
}

/**
 * Rewrite JSON samples with the refresh data
 * @param fileEntities Refresh sample file with file names
 * @param dirPath Samples directory path
 */
export function writeJSONFiles(fileEntities: FileEntity[], dirName: string): void {
  fileEntities.forEach((fileEntity: FileEntity) => {
    writeFileSync(`${dirName}/${fileEntity.filename}`, JSON.stringify(fileEntity.sample, null, 2));
  });
}

/**
 * Generate a random string
 * @param length Length of the generated random string
 */
export function makeId(length: number): string {
  let result: string = '';
  const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength: number = characters.length;
  for (let i: number = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
