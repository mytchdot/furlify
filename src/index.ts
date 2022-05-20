#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { setupDirs, cleanDirIfExists, unpackIntoNamedDir, Logs } from './utils';

import {
  bundle,
  reorganize,
  downloadTar,
  installDeps,
  fetchTarballUrl,
  findPackageEntry,
  findAndMovePackageTypes,
} from './lib/helpers';

import { FULRIFY_DIR } from './lib/constants';

const main = async (args: string[]) => {
  for (const pkg of args) {
    if (!pkg) throw new Error('Missing parameter: <package-name>');

    const pathToNamedDir = path.join(FULRIFY_DIR, pkg);

    const pathToExtractedTarDir = path.join(FULRIFY_DIR, pkg, 'package');

    try {
      setupDirs(pkg);

      const tarballUrl = await fetchTarballUrl(pkg, args);

      await downloadTar(pkg, pathToNamedDir, tarballUrl);

      await unpackIntoNamedDir(pathToExtractedTarDir, pathToNamedDir);

      await installDeps(pathToNamedDir);

      const pathToEntry = findPackageEntry(pathToNamedDir, pkg);

      await findAndMovePackageTypes(pathToNamedDir, pkg);

      const bundled = await bundle(pathToEntry);

      const bundledFilePath = path.join(FULRIFY_DIR, pkg + '.js');

      await fs.promises.writeFile(bundledFilePath, bundled);

      cleanDirIfExists(pathToNamedDir);

      await reorganize(pathToNamedDir, bundledFilePath);
    } catch (err) {
      console.log('Something went wrong: \n', err);
    }
  }
};
const argsFrom = process.env.NODE_ENV === 'test' ? [] : process.argv.slice(2);
main(argsFrom);
export default main;
