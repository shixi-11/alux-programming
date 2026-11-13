// Run the actual template module against a document event target without loading a browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

test('native readiness is announced once, after DOMContentLoaded and with its marker already set', () => {
  const document = new EventTarget() as EventTarget & { documentElement: { setAttribute(name: string, value: string): void } };
  const attributes = new Map<string, string>();
  document.documentElement = { setAttribute: (name, value) => { attributes.set(name, value); } };
  let signals = 0;
  document.addEventListener('alux-native-ready', () => {
    assert.equal(attributes.get('data-native-ready'), '', 'the reader can observe readiness during the signal');
    signals++;
  });
  runInNewContext(readFileSync('web/native-ready.ts', 'utf8'), { document, Event });
  assert.equal(signals, 0, 'loading the module cannot mount the shell ahead of native deferred scripts');
  assert.equal(attributes.size, 0);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(signals, 1);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  assert.equal(signals, 1, 'duplicate readiness cannot remount the reader');
});
