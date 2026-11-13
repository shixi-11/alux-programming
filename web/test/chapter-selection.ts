// Selects canonical browser fixtures by source capabilities, never by generated HTML.
// Callers supply pages derived from expectedSite(); predicates describe the content under test.
import { readFileSync } from 'node:fs';
import type { Edition } from './site.ts';

export interface SourceChapter { file: string; content: string }

/** Reads canonical source chapters in mdBook order, excluding the repeated index alias. */
export function sourceChapters(edition: Edition): SourceChapter[] {
  return edition.pages.slice(1).map(({ file }) => ({
    file, content: readFileSync('src/' + file.replace(/\.html$/, '.md'), 'utf8').replaceAll('\r\n', '\n'),
  }));
}

/** Returns enough matching canonical chapters or reports the missing source capability. */
export function selectChapters(chapters: SourceChapter[], capability: string, accepts: (content: string) => boolean, count = 1): string[] {
  const matches = chapters.filter(({ content }) => accepts(content));
  if (matches.length < count) throw new Error(`Source book requires ${count} chapter(s) with ${capability}; found ${matches.length}`);
  return matches.slice(0, count).map(({ file }) => file);
}
