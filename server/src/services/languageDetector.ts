export interface LanguageConfig {
  ext: string;
  language: string;
  runtime: string;
  compileCommand?: string;
  runCommand: string;
  hasCompilation: boolean;
}

const languageConfigs: Record<string, LanguageConfig> = {
  js: {
    ext: '.js',
    language: 'javascript',
    runtime: 'node',
    runCommand: 'node {file}',
    hasCompilation: false,
  },
  py: {
    ext: '.py',
    language: 'python',
    runtime: 'python3',
    runCommand: 'python3 {file}',
    hasCompilation: false,
  },
  cpp: {
    ext: '.cpp',
    language: 'cpp',
    runtime: 'g++',
    compileCommand: 'g++ -o {output} {file}',
    runCommand: './{output}',
    hasCompilation: true,
  },
  java: {
    ext: '.java',
    language: 'java',
    runtime: 'javac',
    compileCommand: 'javac {file}',
    runCommand: 'java {classname}',
    hasCompilation: true,
  },
  ts: {
    ext: '.ts',
    language: 'typescript',
    runtime: 'node',
    runCommand: 'npx ts-node {file}',
    hasCompilation: false,
  },
};

export const detectLanguageFromPath = (filePath: string): LanguageConfig | null => {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

  for (const [, config] of Object.entries(languageConfigs)) {
    if (config.ext === ext) {
      return config;
    }
  }

  return null;
};

export const detectLanguageFromExtension = (extension: string): LanguageConfig | null => {
  const byLanguageName = getLanguageConfig(extension.toLowerCase());
  if (byLanguageName) {
    return byLanguageName;
  }

  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return detectLanguageFromPath(`file${ext}`);
};

export const getSupportedLanguages = (): string[] => {
  return Object.values(languageConfigs).map(config => config.language);
};

export const getLanguageConfig = (language: string): LanguageConfig | null => {
  return Object.values(languageConfigs).find(config => config.language === language) || null;
};

export default {
  detectLanguageFromPath,
  detectLanguageFromExtension,
  getSupportedLanguages,
  getLanguageConfig,
};
