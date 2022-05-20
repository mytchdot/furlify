import main from '..';
const testLibs = [
  '@babel/preset-env',
  'axios',
  'boxen',
  'chalk',
  'dexie',
  'lodash',
  'react',
];
describe('Main CLI Tool', () => {
  it('should test a list of modules from npm, running one package per call', async () => {
    for (let lib of testLibs) {
      try {
        await main([lib]);
      } catch (err: any) {
        throw new Error(err);
      }
    }
  });
  it('should test a list of modules from npm, running all packages in one call', async () => {
    try {
      await main(testLibs);
    } catch (err: any) {
      throw new Error(err);
    }
  });
});
