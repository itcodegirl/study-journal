import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { installBrowserShims, setViewportWidth } from './browserShims';

installBrowserShims();

beforeEach(() => {
  setViewportWidth(1440);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.body.removeAttribute('style');
});
