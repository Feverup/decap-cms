import prettier from 'prettier/standalone';
import parserYaml from 'prettier/parser-yaml';
import parserMarkdown from 'prettier/parser-markdown';

import yamlFormatter from './yaml';
import tomlFormatter from './toml';
import jsonFormatter from './json';

import type { Options as PrettierOptions } from 'prettier';

const Languages = {
  YAML: 'yaml',
  TOML: 'toml',
  JSON: 'json',
} as const;

type Language = typeof Languages[keyof typeof Languages];

const parsers = {
  [Languages.YAML]: yamlFormatter,
  [Languages.TOML]: tomlFormatter,
  [Languages.JSON]: jsonFormatter,
};

type Format = typeof parsers[keyof typeof parsers];

export class PrettierFormatter {
  language: Language;
  format: Format;
  options?: PrettierOptions;

  constructor(language: Language, options?: PrettierOptions) {
    this.language = language;
    this.format = parsers[language];
    this.options = { parser: this.language, ...options };
  }

  fromFile(content: string) {
    return this.format.fromFile(content);
  }

  toFile(
    data: { body?: string } & Record<string, unknown>,
    sortedKeys?: string[],
    comments?: Record<string, string>,
  ) {
    const file = this.format.toFile(data, sortedKeys, comments);
    return prettier.format(file, this.options);
  }
}

export function prettierYAML(options?: PrettierOptions) {
  return new PrettierFormatter(Languages.YAML, {
    plugins: [parserYaml],
    ...options,
  });
}

export function prettierTOML(options?: PrettierOptions) {
  return new PrettierFormatter(Languages.TOML, {
    plugins: [parserMarkdown],
    ...options,
  });
}

export function prettierJSON(options?: PrettierOptions) {
  return new PrettierFormatter(Languages.JSON, options);
}
