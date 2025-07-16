import { resolve } from 'node:path';

import eslint from './.eslintrc';
import LocalizationGenerator from './scripts/localizationGenerator';

export default function cracoConfig() {
  const localizationGenerator = new LocalizationGenerator();
  localizationGenerator.generateLocalizationFile();

  return {
    webpack: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    eslint,
  };
}
