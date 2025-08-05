const fs = require('fs');
const path = require('path');
const LocalizationGenerator = require('../../localizationGenerator');

jest.mock('fs');

describe('LocalizationGenerator', () => {
  let generator;
  let mockFs;

  const defaultConfig = {
    i18nFolderName: 'i18n',
    modulesPath: 'src/modules',
    localizationFile: 'localization.json',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockFs = {
      readdirSync: jest.fn(),
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
    };

    Object.assign(fs, mockFs);

    generator = new LocalizationGenerator(
      defaultConfig.i18nFolderName,
      defaultConfig.modulesPath,
      defaultConfig.localizationFile
    );
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultGenerator = new LocalizationGenerator();

      expect(defaultGenerator.i18nFolderName).toBe('i18n');
      expect(defaultGenerator.modulesPath).toBe('src/modules');
      expect(defaultGenerator.localizationFile).toBe('localization.json');
      expect(defaultGenerator.pathToWriteLocalization).toBe('src/i18n');
    });

    it('should initialize with custom values', () => {
      const customGenerator = new LocalizationGenerator(
        'custom-i18n',
        'custom/modules',
        'custom.json'
      );

      expect(customGenerator.i18nFolderName).toBe('custom-i18n');
      expect(customGenerator.modulesPath).toBe('custom/modules');
      expect(customGenerator.localizationFile).toBe('custom.json');
    });
  });

  describe('getFeaturePaths', () => {
    it('should find i18n folders recursively in module structure', () => {
      const mockDirectoryStructure = {
        'src/modules': [
          { name: 'feature1', isDirectory: () => true, isFile: () => false },
          { name: 'feature2', isDirectory: () => true, isFile: () => false },
          { name: 'feature3', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature1': [{ name: 'i18n', isDirectory: () => true, isFile: () => false }],
        'src/modules/feature2': [
          { name: 'subfeature', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature2/subfeature': [
          { name: 'i18n', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature3': [{ name: 'nested', isDirectory: () => true, isFile: () => false }],
        'src/modules/feature3/nested': [
          { name: 'deeper', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature3/nested/deeper': [
          { name: 'i18n', isDirectory: () => true, isFile: () => false },
        ],
      };

      mockFs.readdirSync.mockImplementation((dir) => {
        const entries = mockDirectoryStructure[dir];
        if (!entries) {
          throw new Error(`Directory not found: ${dir}`);
        }
        return entries;
      });

      const result = generator.getFeaturePaths();

      expect(result).toEqual([
        path.join('src/modules', 'feature1', 'i18n'),
        path.join('src/modules', 'feature2', 'subfeature', 'i18n'),
        path.join('src/modules', 'feature3', 'nested', 'deeper', 'i18n'),
      ]);
    });

    it('should return empty array when no i18n folders exist', () => {
      const mockDirectoryStructure = {
        'src/modules': [
          { name: 'feature1', isDirectory: () => true, isFile: () => false },
          { name: 'feature2', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature1': [
          { name: 'config.json', isDirectory: () => false, isFile: () => true },
        ],
        'src/modules/feature2': [
          { name: 'data.txt', isDirectory: () => false, isFile: () => true },
        ],
      };

      mockFs.readdirSync.mockImplementation((dir) => {
        const entries = mockDirectoryStructure[dir];
        if (!entries) {
          return [];
        }
        return entries;
      });

      const result = generator.getFeaturePaths();

      expect(result).toEqual([]);
    });

    it('should handle mixed file and directory entries', () => {
      // Mock the recursive directory structure
      const mockDirectoryStructure = {
        'src/modules': [
          { name: 'feature1', isDirectory: () => true, isFile: () => false },
          { name: 'README.md', isDirectory: () => false, isFile: () => true },
          { name: 'i18n', isDirectory: () => true, isFile: () => false },
        ],
        'src/modules/feature1': [
          { name: 'somefile.txt', isDirectory: () => false, isFile: () => true },
        ],
      };

      mockFs.readdirSync.mockImplementation((dir) => {
        const entries = mockDirectoryStructure[dir];
        if (!entries) {
          return []; // Return empty array for unknown directories to prevent infinite recursion
        }
        return entries;
      });

      const result = generator.getFeaturePaths();

      expect(result).toEqual([path.join('src/modules', 'i18n')]);
    });

    it('should handle empty directory', () => {
      mockFs.readdirSync.mockReturnValue([]);

      const result = generator.getFeaturePaths();

      expect(result).toEqual([]);
    });
  });

  describe('getLocalizationFromFolder', () => {
    it('should read and parse JSON localization files', () => {
      const folderPath = 'test/path/i18n';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'en.json', isFile: () => true },
        { name: 'de.json', isFile: () => true },
        { name: 'fr.json', isFile: () => true },
        { name: 'README.md', isFile: () => true }, // Should be ignored
      ]);

      const mockFileContents = {
        'en.json': JSON.stringify({ hello: 'Hello', welcome: 'Welcome' }),
        'de.json': JSON.stringify({ hello: 'Hallo', goodbye: 'Auf Wiedersehen' }),
        'fr.json': JSON.stringify({ hello: 'Bonjour' }),
      };

      mockFs.readFileSync.mockImplementation((filePath) => {
        const fileName = path.basename(filePath);
        return mockFileContents[fileName] || '';
      });

      const result = generator.getLocalizationFromFolder(folderPath);

      expect(result).toEqual({
        en: { translation: { hello: 'Hello', welcome: 'Welcome' } },
        de: { translation: { hello: 'Hallo', goodbye: 'Auf Wiedersehen' } },
        fr: { translation: { hello: 'Bonjour' } },
      });
    });

    it('should return empty object when folder does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = generator.getLocalizationFromFolder('nonexistent/path');

      expect(result).toEqual({});
      expect(mockFs.readdirSync).not.toHaveBeenCalled();
    });

    it('should handle empty i18n folder', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([]);

      const result = generator.getLocalizationFromFolder('empty/i18n');

      expect(result).toEqual({});
    });

    it('should ignore non-JSON files', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'en.json', isFile: () => true },
        { name: 'config.js', isFile: () => true },
        { name: 'README.md', isFile: () => true },
        { name: 'styles.css', isFile: () => true },
      ]);

      mockFs.readFileSync.mockReturnValue(JSON.stringify({ test: 'value' }));

      const result = generator.getLocalizationFromFolder('test/i18n');

      expect(result).toEqual({
        en: { translation: { test: 'value' } },
      });
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid JSON gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'en.json', isFile: () => true },
        { name: 'de.json', isFile: () => true },
      ]);

      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('en.json')) {
          return JSON.stringify({ valid: 'json' });
        }
        return 'invalid json content';
      });

      expect(() => {
        generator.getLocalizationFromFolder('test/i18n');
      }).toThrow();
    });
  });

  describe('deepMerge', () => {
    it('should deeply merge nested objects', () => {
      const target = {
        user: { name: 'John', settings: { theme: 'dark' } },
        app: { version: '1.0' },
      };
      const source = {
        user: { age: 30, settings: { language: 'en' } },
        features: { new: true },
      };

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30,
          settings: { theme: 'dark', language: 'en' },
        },
        app: { version: '1.0' },
        features: { new: true },
      });
    });

    it('should overwrite primitive values', () => {
      const target = { name: 'John', age: 25, active: true };
      const source = { name: 'Jane', age: 30 };

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({
        name: 'Jane',
        age: 30,
        active: true,
      });
    });

    it('should handle empty objects', () => {
      const target = {};
      const source = {};

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({});
    });

    it('should handle null and undefined values', () => {
      const target = { name: 'John', value: null };
      const source = { age: undefined, value: 'new' };

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({
        name: 'John',
        age: undefined,
        value: 'new',
      });
    });

    it('should skip __proto__ and constructor keys for security', () => {
      const target = { safe: 'value' };
      const source = {
        __proto__: { malicious: true },
        constructor: 'dangerous',
        safeKey: 'safe value',
      };

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({
        safe: 'value',
        safeKey: 'safe value',
      });

      // Verify security properties are not present
      expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    });

    it('should handle arrays as primitive values', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [4, 5, 6] };

      const result = generator.deepMerge(target, source);

      expect(result).toEqual({
        items: [4, 5, 6],
      });
    });
  });

  describe('writeLocalizationFile', () => {
    it('should create directory and write file', () => {
      const fileContent = JSON.stringify({ test: 'data' });
      const filePath = 'src/i18n/localization.json';

      generator.writeLocalizationFile(fileContent, filePath);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('src/i18n', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, fileContent);
    });

    it('should handle nested directory creation', () => {
      const fileContent = 'test content';
      const filePath = 'deeply/nested/path/file.json';

      generator.writeLocalizationFile(fileContent, filePath);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('deeply/nested/path', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(filePath, fileContent);
    });
  });

  describe('generateLocalizationFile', () => {
    it('should generate complete localization file from multiple features', () => {
      const featurePaths = ['feature1/i18n', 'feature2/i18n', 'feature3/i18n'];

      jest.spyOn(generator, 'getFeaturePaths').mockReturnValue(featurePaths);

      const mockLocalizationData = {
        'feature1/i18n': {
          en: { translation: { hello: 'Hello', welcome: 'Welcome' } },
          de: { translation: { hello: 'Hallo' } },
        },
        'feature2/i18n': {
          en: { translation: { goodbye: 'Goodbye', thanks: 'Thanks' } },
          fr: { translation: { hello: 'Bonjour' } },
        },
        'feature3/i18n': {
          en: { translation: { error: 'Error' } },
          de: { translation: { goodbye: 'Auf Wiedersehen' } },
        },
      };

      jest.spyOn(generator, 'getLocalizationFromFolder').mockImplementation((folder) => {
        return mockLocalizationData[folder] || {};
      });

      const writeSpy = jest.spyOn(generator, 'writeLocalizationFile').mockImplementation(() => {});

      generator.generateLocalizationFile();

      expect(writeSpy).toHaveBeenCalledTimes(1);

      const expectedOutput = {
        en: {
          translation: {
            hello: 'Hello',
            welcome: 'Welcome',
            goodbye: 'Goodbye',
            thanks: 'Thanks',
            error: 'Error',
          },
        },
        de: {
          translation: {
            hello: 'Hallo',
            goodbye: 'Auf Wiedersehen',
          },
        },
        fr: {
          translation: {
            hello: 'Bonjour',
          },
        },
      };

      const actualContent = JSON.parse(writeSpy.mock.calls[0][0]);
      expect(actualContent).toEqual(expectedOutput);

      const actualPath = writeSpy.mock.calls[0][1];
      expect(actualPath).toContain(generator.pathToWriteLocalization);
      expect(actualPath).toContain(defaultConfig.localizationFile);
    });

    it('should do nothing when no feature paths are found', () => {
      jest.spyOn(generator, 'getFeaturePaths').mockReturnValue([]);
      const writeSpy = jest.spyOn(generator, 'writeLocalizationFile');

      generator.generateLocalizationFile();

      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should handle empty localization data', () => {
      const featurePaths = ['feature1/i18n'];

      jest.spyOn(generator, 'getFeaturePaths').mockReturnValue(featurePaths);
      jest.spyOn(generator, 'getLocalizationFromFolder').mockReturnValue({});
      const writeSpy = jest.spyOn(generator, 'writeLocalizationFile').mockImplementation(() => {});

      generator.generateLocalizationFile();

      expect(writeSpy).toHaveBeenCalledTimes(1);

      const actualContent = JSON.parse(writeSpy.mock.calls[0][0]);
      expect(actualContent).toEqual({});
    });

    it('should handle single language localization', () => {
      const featurePaths = ['feature1/i18n'];

      jest.spyOn(generator, 'getFeaturePaths').mockReturnValue(featurePaths);
      jest.spyOn(generator, 'getLocalizationFromFolder').mockReturnValue({
        en: { translation: { hello: 'Hello' } },
      });
      const writeSpy = jest.spyOn(generator, 'writeLocalizationFile').mockImplementation(() => {});

      generator.generateLocalizationFile();

      expect(writeSpy).toHaveBeenCalledTimes(1);

      const actualContent = JSON.parse(writeSpy.mock.calls[0][0]);
      expect(actualContent).toEqual({
        en: { translation: { hello: 'Hello' } },
      });
    });

    it('should generate proper output path', () => {
      const featurePaths = ['feature1/i18n'];

      jest.spyOn(generator, 'getFeaturePaths').mockReturnValue(featurePaths);
      jest.spyOn(generator, 'getLocalizationFromFolder').mockReturnValue({
        en: { translation: { test: 'value' } },
      });
      const writeSpy = jest.spyOn(generator, 'writeLocalizationFile').mockImplementation(() => {});

      generator.generateLocalizationFile();

      const actualPath = writeSpy.mock.calls[0][1];
      const expectedPath = path.join(
        process.cwd(), // Project root
        generator.pathToWriteLocalization,
        defaultConfig.localizationFile
      );

      expect(actualPath).toBe(expectedPath);
    });
  });
});
