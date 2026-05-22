const fs = require('fs');
const path = require('path');

class LocalizationGenerator {
  constructor(
    i18nFolderName = 'i18n',
    modulesPath = 'src',
    localizationFile = 'localization.json',
    outputPath = 'src/i18n',
    requiredLocales = ['en', 'uk']
  ) {
    this.modulesPath = modulesPath;
    this.i18nFolderName = i18nFolderName;
    this.localizationFile = localizationFile;
    this.pathToWriteLocalization = outputPath;
    this.requiredLocales = requiredLocales;
  }

  generateLocalizationFile() {
    const featurePaths = this.getFeaturePaths();

    if (!featurePaths.length) return;

    this.validateRequiredLocales(featurePaths);

    const localizationObj = featurePaths.reduce((acc, featurePath) => {
      const parsedLocalization = this.getLocalizationFromFolder(featurePath);

      Object.keys(parsedLocalization).forEach((language) => {
        if (!acc[language]) {
          acc[language] = { translation: {} };
        }

        acc[language].translation = this.deepMerge(
          acc[language].translation,
          parsedLocalization[language].translation
        );
      });

      return acc;
    }, {});

    const outputPath = path.join(
      process.cwd(),
      this.pathToWriteLocalization,
      this.localizationFile
    );
    const fileContent = JSON.stringify(localizationObj, null, 2);
    this.writeLocalizationFile(fileContent, outputPath);
    return { outputPath, localizationObj };
  }

  getFeaturePaths() {
    const featureDirs = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === this.i18nFolderName) {
            const outputDirAbs = path.resolve(
              path.dirname(__dirname),
              this.pathToWriteLocalization
            );
            if (path.resolve(fullPath) !== outputDirAbs) {
              featureDirs.push(fullPath);
            }
          } else {
            walk(fullPath);
          }
        }
      }
    };
    walk(this.modulesPath);
    return featureDirs;
  }

  validateRequiredLocales(featurePaths) {
    const missing = [];
    for (const featurePath of featurePaths) {
      if (!fs.existsSync(featurePath)) continue;
      const present = new Set(
        fs
          .readdirSync(featurePath, { withFileTypes: true })
          .filter((file) => file.isFile() && file.name.endsWith('.json'))
          .filter((file) => file.name !== this.localizationFile)
          .map((file) => file.name.split('.')[0])
      );
      const missingForFeature = this.requiredLocales.filter((locale) => !present.has(locale));
      if (missingForFeature.length) {
        missing.push(`${featurePath}: missing ${missingForFeature.join(', ')}`);
      }
    }
    if (missing.length) {
      console.warn(`Localization generator: required locale files missing.\n${missing.join('\n')}`);
    }
  }

  getLocalizationFromFolder(i18nFolderPath) {
    if (!fs.existsSync(i18nFolderPath)) return {};
    const files = fs.readdirSync(i18nFolderPath, { withFileTypes: true });
    return files.reduce((acc, file) => {
      if (!file.isFile() || !file.name.endsWith('.json')) return acc;
      if (file.name === this.localizationFile) return acc;
      const [language] = file.name.split('.');
      const content = fs.readFileSync(path.join(i18nFolderPath, file.name), 'utf8');
      let parsed = {};
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.warn(
          `Skipping invalid JSON: ${path.join(i18nFolderPath, file.name)} - ${e.message}`
        );
        return acc;
      }
      acc[language] = acc[language] || { translation: {} };
      acc[language].translation = this.deepMerge(acc[language].translation, parsed);
      return acc;
    }, {});
  }

  writeLocalizationFile(fileContent, filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFileSync(filePath, fileContent, { encoding: 'utf8', mode: 0o644 });
  }

  deepMerge(target = {}, source = {}) {
    for (const key of Object.keys(source)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        source[key].constructor === Object
      ) {
        target[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

module.exports = LocalizationGenerator;
