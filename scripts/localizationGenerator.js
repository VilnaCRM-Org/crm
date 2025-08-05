const fs = require('fs');
const path = require('path');

class LocalizationGenerator {
  constructor(
    i18nPath = 'i18n',
    modulesPath = 'src/modules',
    localizationFile = 'localization.json'
  ) {
    this.modulesPath = modulesPath;
    this.localizationFile = localizationFile;
    this.pathToWriteLocalization = 'src/i18n';
    this.i18nFolderName = i18nPath;
  }

  generateLocalizationFile() {
    const i18nFilePaths = this.findI18nFiles(this.modulesPath);

    if (!i18nFilePaths.length) return;

    const localizationObj = i18nFilePaths.reduce((acc, filePath) => {
      const fileName = path.basename(filePath); // en.json
      const [language] = fileName.split('.');

      if (!acc[language]) {
        acc[language] = { translation: {} };
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileContent);

      acc[language].translation = this.deepMerge(acc[language].translation, parsed);

      return acc;
    }, {});

    const outputPath = path.join(
      path.dirname(__dirname),
      this.pathToWriteLocalization,
      this.localizationFile
    );
    const fileContent = JSON.stringify(localizationObj, null, 2);
    this.writeLocalizationFile(fileContent, outputPath);
  }

  findI18nFiles(startPath) {
    const results = [];

    const walk = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          if (file.name === this.i18nFolderName) {
            // collect all .json files in i18n folder
            const jsonFiles = fs
              .readdirSync(fullPath)
              .filter((f) => f.endsWith('.json'))
              .map((f) => path.join(fullPath, f));

            results.push(...jsonFiles);
          } else {
            walk(fullPath);
          }
        }
      }
    };

    walk(startPath);
    return results;
  }

  writeLocalizationFile(fileContent, filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        throw new Error(err);
      }
    });
  }

  deepMerge(target = {}, source = {}) {
    for (const key of Object.keys(source)) {
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }

      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

module.exports = LocalizationGenerator;
