export const FULRIFY_DIR = 'furlify';
export const EXT = '.tgz';
export const IMPORT_META_REGEX = /import.meta.url/g;
export const IMPORT_META_REPLACEMENT = `require('url').pathToFileURL(__filename).toString()`;
export const COLORS = [
  [135, 25, 201],
  [35, 90, 215],
  [79, 226, 226],
  [122, 255, 63],
  [241, 46, 214],
];
