import { List } from 'immutable';
import { get } from 'lodash';

import yamlFormatter from './yaml';
import tomlFormatter from './toml';
import jsonFormatter from './json';
import { FrontmatterInfer, frontmatterJSON, frontmatterTOML, frontmatterYAML } from './frontmatter';
import { prettierJSON, prettierTOML, prettierYAML } from './prettier';

import type { Options as PrettierOptions } from 'prettier';
import type { Delimiter } from './frontmatter';
import type { Collection, EntryObject, Format } from '../types/redux';
import type { EntryValue } from '../valueObjects/Entry';

export const frontmatterFormats = ['yaml-frontmatter', 'toml-frontmatter', 'json-frontmatter'];

export const formatExtensions = {
  yml: 'yml',
  yaml: 'yml',
  toml: 'toml',
  json: 'json',
  frontmatter: 'md',
  'yaml-frontmatter': 'md',
  'toml-frontmatter': 'md',
  'json-frontmatter': 'md',
  'yaml-prettier': 'yml',
  'toml-prettier': 'toml',
  'json-prettier': 'json',
};

export const extensionFormatters = {
  yml: yamlFormatter,
  yaml: yamlFormatter,
  toml: tomlFormatter,
  json: jsonFormatter,
  md: FrontmatterInfer,
  markdown: FrontmatterInfer,
};

function formatByName(
  name: Format,
  { customDelimiter, prettierOptions }: { customDelimiter?: Delimiter; prettierOptions?: PrettierOptions },
) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    frontmatter: FrontmatterInfer,
    'yaml-frontmatter': frontmatterYAML(customDelimiter),
    'toml-frontmatter': frontmatterTOML(customDelimiter),
    'json-frontmatter': frontmatterJSON(customDelimiter),
    'yaml-prettier': prettierYAML(prettierOptions),
    'toml-prettier': prettierTOML(prettierOptions),
    'json-prettier': prettierJSON(prettierOptions),
  }[name];
}

function frontmatterDelimiterIsList(
  frontmatterDelimiter?: Delimiter | List<string>,
): frontmatterDelimiter is List<string> {
  return List.isList(frontmatterDelimiter);
}

export function resolveFormat(collection: Collection, entry: EntryObject | EntryValue) {
  // Check for custom delimiter
  const frontmatter_delimiter = collection.get('frontmatter_delimiter');
  const customDelimiter = frontmatterDelimiterIsList(frontmatter_delimiter)
    ? (frontmatter_delimiter.toArray() as [string, string])
    : frontmatter_delimiter;
  const prettierOptions = collection.get('prettier')?.toJS();

  // If the format is specified in the collection, use that format.
  const formatSpecification = collection.get('format');
  if (formatSpecification) {
    return formatByName(formatSpecification, { customDelimiter, prettierOptions });
  }

  // If a file already exists, infer the format from its file extension.
  const filePath = entry && entry.path;
  if (filePath) {
    const fileExtension = filePath.split('.').pop();
    if (fileExtension) {
      return get(extensionFormatters, fileExtension);
    }
  }

  // If creating a new file, and an `extension` is specified in the
  //   collection config, infer the format from that extension.
  const extension = collection.get('extension');
  if (extension) {
    return get(extensionFormatters, extension);
  }

  // If no format is specified and it cannot be inferred, return the default.
  return formatByName('frontmatter', { customDelimiter, prettierOptions });
}
