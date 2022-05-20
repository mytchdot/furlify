import * as fs from 'fs';
import * as tar from 'tar';
import * as path from 'path';
import * as https from 'https';
import { promisify } from 'util';
import { exec as execute } from 'child_process';

import glob from 'glob';

import furler from '../../../furled/src';

import { Logs } from '../utils';
import {
  EXT,
  FULRIFY_DIR,
  IMPORT_META_REGEX,
  IMPORT_META_REPLACEMENT,
} from './constants';

import type { PromiseResolver } from '../types';

const exec = promisify(execute);
const globPromisified = promisify(glob);

export const parsePackageJson = (
  searchArray: string[],
  searchItem: string,
  resolveTo = searchItem
) => {
  const valueIsArray = Array.isArray(searchArray);

  if (!searchArray || !valueIsArray) return resolveTo;

  if (searchArray.includes(searchItem)) {
    return searchArray[searchArray.indexOf(searchItem)];
  }

  return resolveTo;
};

export const importPackageJson = (pathToNamedDir: string) => {
  return require(path.resolve(pathToNamedDir, 'package.json'));
};

export const findPackageEntry = (pathToNamedDir: string, pkg: string) => {
  Logs.npm.searchingPackageJson(pkg);
  const packagePackageJson = importPackageJson(pathToNamedDir);

  const packageFilesProperty = parsePackageJson(
    packagePackageJson.files,
    'index.js'
  );

  const packageEntry = packagePackageJson.main ?? packageFilesProperty;

  const pathToEntry = path.resolve(FULRIFY_DIR, pkg, packageEntry);

  if (!pathToEntry) {
    throw new Error('No entry point found in pkg.json\n' + 'Reading:' + pkg);
  }
  Logs.npm.packageJsonSearched();
  return pathToEntry;
};

export const findAndMovePackageTypes = async (
  pathToNamedDir: string,
  pkg: string
) => {
  const packagePackageJson = importPackageJson(pathToNamedDir);

  const packageFilesProperty = parsePackageJson(
    packagePackageJson.files,
    'index.d.ts'
  );

  const typesFromPackageJson = packagePackageJson.types ?? packageFilesProperty;

  const pathToTypesFromPackageJson = path.resolve(
    pathToNamedDir,
    typesFromPackageJson
  );

  if (fs.existsSync(pathToTypesFromPackageJson)) {
    return await fs.promises.rename(
      pathToTypesFromPackageJson,
      path.join(pathToNamedDir, '..', pkg + '.d.ts')
    );
  }

  const globPromise = globPromisified(
    pathToNamedDir + '/' + '{,!(node_modules)/**/}*.d.ts'
  );

  for await (let file of await globPromise) {
    const filename = file.split('/').at(-1) ?? 'index.d.ts';
    const newPath = path.join(pathToNamedDir, '..', filename);
    if (!fs.existsSync(newPath)) {
      await fs.promises.rename(file, newPath);
    }
  }
};

export const bundle = async (pathToEntry: string) => {
  Logs.bundle.bundling();

  const bundlePromise = await new Promise((resolve) => {
    resolve(
      furler(pathToEntry, {
        cache: false,
        quiet: true,
      })
    );
  });
  // todo
  const code = (bundlePromise as any).code.replace(
    IMPORT_META_REGEX,
    IMPORT_META_REPLACEMENT
  );
  return code;
};

export const fetchTarballUrl = async (pkg: string, pkgs: string[]) => {
  Logs.npm.downloadingPackage(pkg, pkgs);
  const { stderr, stdout } = await exec(`npm view ${pkg} dist.tarball`);
  if (stderr) throw new Error(stderr);
  return stdout;
};

export const downloadTar = async (
  pkg: string,
  writeTo: string,
  tarballUrl: string
) => {
  const tarEventListener = (resolve: PromiseResolver) => () => {
    const versionFromUrl = tarballUrl
      .split('/')
      .at(-1)!
      .split('-')
      .at(-1)!
      .split(EXT)[0];

    Logs.tar.downloadedFile(pkg, versionFromUrl);

    return resolve(null);
  };

  const tarStream = (resolve: PromiseResolver) => {
    return tar.x({ C: writeTo }).on('finish', tarEventListener(resolve));
  };

  const tarPromise = await new Promise((resolve) =>
    https.get(tarballUrl, (resp) => resp.pipe(tarStream(resolve)))
  );

  return tarPromise;
};

export const installDeps = async (pathToNamedDir: string) => {
  const installDepsScript = `npm install --omit-dev --prefix ${pathToNamedDir} `;

  Logs.npm.fetchingDeps();
  const { stderr } = await exec(installDepsScript);
  if (stderr && !stderr.includes('WARN')) {
    Logs.npm.cliOutput(stderr);
  }
  Logs.npm.depsDownloaded();
};

export const reorganize = async (
  pathToNamedDir: string,
  bundledFilePath: string
) => {
  const pathToTypeFiles = path.join(pathToNamedDir, '..');
  const typeFiles = fs.readdirSync(pathToTypeFiles);

  const typeFilesMovePromise = typeFiles.reduce(
    (prev: Promise<void>[], file) => {
      if (file.includes('.d.ts')) {
        const oldPath = path.join(pathToTypeFiles, file);
        const newPath = path.join(pathToNamedDir, 'index.d.ts');
        prev.push(fs.promises.rename(oldPath, newPath));
      }
      return prev;
    },
    []
  );

  const bundleFileMovePromise = fs.promises.rename(
    bundledFilePath,
    path.join(pathToNamedDir, 'index.js')
  );
  await Promise.all([...typeFilesMovePromise, bundleFileMovePromise]);
  Logs.end();
};
