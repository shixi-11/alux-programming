// Proves source capability selection rejects missing fixtures instead of falling back to an unrelated page.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectChapters } from './chapter-selection.ts';

test('source selection returns canonical routes with the requested capability', () => {
  assert.deepEqual(selectChapters([{file:'plain.html',content:'plain'}, {file:'nested/table.html',content:'| a | b |'}], 'tables', text => /^\|/m.test(text)), ['nested/table.html']);
});
test('source selection clearly fails when no chapter satisfies the capability', () => {
  assert.throws(() => selectChapters([{file:'plain.html',content:'plain'}], 'tables', text => /^\|/m.test(text)), /requires 1 chapter\(s\) with tables; found 0/);
});
test('source selection rejects insufficient distinct matches', () => {
  assert.throws(() => selectChapters([{file:'one.html',content:'code'}], 'code', text => text.includes('code'), 2), /requires 2 chapter\(s\) with code; found 1/);
});
