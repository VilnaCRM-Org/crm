const fs = require('fs');
const path = require('path');

class LocalizationGenerator {
  constructor(
    i18nPath = 'i18n',
    featurePath = 'src/features',
    jsonFileType = 'json',
    localizationFile = 'localization.json'
  ) {
    this.featurePath = featurePath;
    this.jsonFileType = jsonFileType;
    this.localizationFile = localizationFile;

    this.pathToWriteLocalization = `src/${i18nPath}`;
    this.pathToI18nFolder = `${featurePath}/{folder}/${i18nPath}`;
    this.pathToI18nFile = `${featurePath}/{folder}/${i18nPath}/{file.name}`;
  }

  generateLocalizationFile() {
    const featureFolders = this.getFeatureFolders();

    if (!featureFolders.length) return;

    const localizationObj = featureFolders.reduce((acc, folder) => {
      const parsedLocalizationFromFolder = this.getLocalizationFromFolder(folder);

      Object.keys(parsedLocalizationFromFolder).forEach((language) => {
        if (!acc[language]) {
          acc[language] = { translation: {} };
        }

        acc[language].translation = this.deepMerge(
          acc[language].translation,
          parsedLocalizationFromFolder[language].translation
        );
      });

      return acc;
    }, {});

    const filePath = path.join(
      path.dirname(__dirname),
      this.pathToWriteLocalization,
      this.localizationFile
    );
    const fileContent = JSON.stringify(localizationObj);

    this.writeLocalizationFile(fileContent, filePath);
  }

  getFeatureFolders() {
    const featureDirectories = fs.readdirSync(this.featurePath, {
      withFileTypes: true,
    });

    return featureDirectories
      .filter((directory) => directory.isDirectory())
      .map((directory) => directory.name);
  }

  getLocalizationFromFolder(folder) {
    const localizationFiles = fs.readdirSync(this.pathToI18nFolder.replace('{folder}', folder), {
      withFileTypes: true,
    });

    return localizationFiles.reduce((localizations, file) => {
      if (!file.isFile()) return localizations;

      const [language, fileType] = file.name.split('.');

      if (fileType !== this.jsonFileType) return localizations;

      const localizationContent = fs.readFileSync(
        this.pathToI18nFile.replace('{folder}', folder).replace('{file.name}', file.name),
        'utf8'
      );
      const parsedLocalization = JSON.parse(localizationContent);

      return {
        ...localizations,
        [language]: {
          translation: parsedLocalization,
        },
      };
    }, {});
  }

  // eslint-disable-next-line class-methods-use-this
  writeLocalizationFile(fileContent, filePath) {
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
