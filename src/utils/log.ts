import chalk from 'chalk';
import { COLORS } from '../lib/constants';

const getRandomRgbColorArray = () => COLORS[(5 * Math.random()) | 0];

const rgbArr = getRandomRgbColorArray();
const randomColor = chalk.rgb(rgbArr[0], rgbArr[1], rgbArr[2]);

export const log = (...args: string[]) =>
  console.log(
    chalk.bold(
      '[',
      chalk.cyan('furlify') +
        chalk.reset() +
        chalk.bold(' ] ') +
        chalk.reset() +
        args.join(' ')
    ),
    '\n'
  );

export const Logs = {
  dir: {
    initDirScan: () =>
      log(chalk.cyan('Creating directories...') + chalk.reset()),
    initDirScanFin: (pkg: string) =>
      log(
        chalk.green('Directories created.'),
        chalk.dim('[ `./furlify/`, `./furlify/' + pkg + '/` ]')
      ),
    cleaning: () => log(chalk.cyan('Cleaning up...') + chalk.reset()),
    notFoundCreating: (dir: string) =>
      log(chalk.yellow(`'${dir}' does not exist. Creating...`)),
  },
  npm: {
    downloadingPackage: (pkg: string, pkgs: string[]) => {
      const pkgOfPkgs =
        pkgs.length > 1
          ? chalk.dim(`[ ${pkgs.indexOf(pkg) + 1} / ${pkgs.length} ]`)
          : '';

      log(chalk.cyan('Downloading'), randomColor(pkg + '...') + pkgOfPkgs);
    },
    fetchingDeps: () => log(chalk.cyan('Fetching deps...')),
    depsDownloaded: () => log(chalk.green('Deps retreived.') + chalk.reset()),
    cliOutput: (stderr: string) => {
      log(chalk.gray(stderr) + chalk.reset());
    },
    searchingPackageJson: (pkg: string) => {
      const plural = pkg.endsWith('s') || pkg.endsWith('z') ? "'" : "'s";
      log(
        chalk.cyan('Rummaging through'),
        randomColor(pkg + plural),
        chalk.cyan('package.json...')
      );
    },
    packageJsonSearched: () => {
      log(chalk.green('Found entry point.'));
    },
  },
  tar: {
    downloadedFile: (pkg: string, version: string) =>
      log(
        chalk.green('Download Completed.') +
          chalk.reset() +
          chalk.dim(` [ ${pkg}@${version} ]`)
      ),
  },
  bundle: {
    bundling: () => log(chalk.cyan('Bundling...') + chalk.reset()),
    completed: () => log(chalk.green('Bundle completed.') + chalk.reset()),
  },
  dev: {
    babelPreset: () =>
      chalk.dim(
        'Using @babel/preset-env from node_modules. This is a development only log.\n'
      ),
  },
  end: () => log(chalk.green('All set ✅') + chalk.reset()),
};
