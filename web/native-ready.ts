// Loaded by the mdBook template before DOMContentLoaded. Native deferred scripts bind first;
// reader.ts waits for this signal before retaining the document inside the chapter shell.
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-native-ready', '');
  document.dispatchEvent(new Event('alux-native-ready'));
}, { once: true });
