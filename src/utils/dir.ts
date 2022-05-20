import * as fs from 'fs';
import * as path from 'path';
import { Logs } from './log';
import { FULRIFY_DIR } from '../lib';

export const createDirIfNotExists = async (dir: string, quiet = false) => {
  try {
    const dirParams = dir.split('/');

    dirParams.reduce((directories, directory) => {
      directories += directory + '/';

      if (!fs.existsSync(path.join(process.cwd(), directories))) {
        if (!quiet) Logs.dir.notFoundCreating(dir);
        fs.mkdirSync(path.join(process.cwd(), directories));
      }

      return directories;
    }, '');
  } catch (err: any) {
    throw new Error(err);
  }
};

export const removeDirIfExists = (dir: string) => {
  try {
    const dirPath = path.join(process.cwd(), dir);

    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true });
    }
  } catch (err: any) {
    throw new Error(err);
  }
};

// Can't fs.readdir + fs.unlink due to `node_modules` perms requirement.
export const cleanDirIfExists = (dir: string) => {
  Logs.dir.cleaning();
  try {
    const dirPath = path.join(process.cwd(), dir);

    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true });
    }
    fs.mkdirSync(dirPath);
  } catch (err: any) {
    throw new Error(err);
  }
};

export const unpackIntoNamedDir = async (
  subdir: string,
  pathToNamedDir: string
) => {
  try {
    for await (let file of await fs.promises.readdir(subdir)) {
      fs.promises.rename(
        path.join(subdir, file),
        path.join(pathToNamedDir, file)
      );
    }
  } catch (err: any) {
    throw new Error(err);
  }
};

export const setupDirs = (pkg: string) => {
  Logs.dir.initDirScan();
  createDirIfNotExists(FULRIFY_DIR, false);
  removeDirIfExists(path.join('/furlify', pkg));
  createDirIfNotExists(path.join('/furlify', pkg), true);
  Logs.dir.initDirScanFin(pkg);
};
