import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseEntranceLanguage, languageFromCountry } from '../entrance.ts';

test('manual preference wins without calling country detection', async () => {
  let called = false;
  const language = await chooseEntranceLanguage('ja', async () => { called = true; return { country: 'DE' }; });
  assert.equal(language, 'ja');
  assert.equal(called, false);
});

test('country detection maps supported country and invalid country falls back to browser language', async () => {
  assert.equal(await chooseEntranceLanguage(undefined, async () => ({ country: 'CN' }), 'en-US'), 'zh');
  assert.equal(await chooseEntranceLanguage(undefined, async () => ({ country: '??' }), 'es-MX'), 'es');
  assert.equal(languageFromCountry({ country: 'not-a-country' }), undefined);
  assert.equal(await chooseEntranceLanguage(undefined, async () => ({ country: 'IN' }), 'zh-CN'), 'en');
});

test('country timeout falls back without waiting a UI-length request', async () => {
  const started = Date.now();
  const language = await chooseEntranceLanguage(undefined, () => new Promise(() => undefined), 'ko-KR');
  assert.equal(language, 'ko');
  assert.ok(Date.now() - started < 1200);
});

test('country rejection falls back to browser language', async () => {
  assert.equal(await chooseEntranceLanguage(undefined, async () => { throw new Error('offline'); }, 'zh-TW'), 'zh-hant');
});

test('welcome autoplay is retried only by trusted interaction and dispose pauses it', async () => {
  const listeners = new Map<string, EventListener>();
  const oldDocument = globalThis.document;
  const oldObserver = globalThis.MutationObserver;
  let plays = 0;
  let pauses = 0;
  const fakeDocument = {
    visibilityState: 'visible', documentElement: {},
    addEventListener(type: string, listener: EventListener) { listeners.set(type, listener); },
    removeEventListener(type: string) { listeners.delete(type); },
  } as unknown as Document;
  globalThis.document = fakeDocument;
  globalThis.MutationObserver = undefined as unknown as typeof MutationObserver;
  try {
    const { bindWelcome } = await import('../entrance.ts');
    const audio = { ended:false, play: () => { plays++; return Promise.reject(new Error('blocked')); }, pause: () => { pauses++; } };
    const dispose = bindWelcome(audio, () => true);
    assert.equal(plays, 1);
    listeners.get('pointerdown')?.({ isTrusted: false } as Event);
    assert.equal(plays, 1);
    listeners.get('pointerdown')?.({ isTrusted: true } as Event);
    assert.equal(plays, 2);
    dispose();
    assert.equal(pauses, 1);
    Object.defineProperty(fakeDocument, 'visibilityState', { configurable:true, value:'hidden' });
    const disposeHidden = bindWelcome(audio, () => true);
    assert.equal(plays, 2, 'a controller created in a hidden tab cannot start audio');
    listeners.get('pointerdown')?.({ isTrusted:true } as Event);
    assert.equal(plays, 2, 'hidden trusted events cannot start audio either');
    Object.defineProperty(fakeDocument, 'visibilityState', { configurable:true, value:'visible' });
    listeners.get('visibilitychange')?.(new Event('visibilitychange'));
    assert.equal(plays, 3, 'returning to a visible entrance retries welcome playback');
    audio.ended = true;
    listeners.get('pointerdown')?.({ isTrusted:true } as Event);
    listeners.get('keydown')?.({ isTrusted:true } as Event);
    listeners.get('visibilitychange')?.(new Event('visibilitychange'));
    assert.equal(plays, 3, 'completed narration is not an autoplay recovery');
    disposeHidden();
  } finally {
    globalThis.document = oldDocument;
    globalThis.MutationObserver = oldObserver;
  }
});
