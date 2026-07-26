/**
 * Test setup — runs before all frontend tests.
 * Configures jsdom environment and custom matchers.
 */
import "@testing-library/jest-dom/vitest";

// Mock localStorage for AuthContext tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch globally for API tests
const originalFetch = global.fetch;
beforeEach(() => {
  localStorageMock.clear();
  global.fetch = originalFetch;
});

// Suppress console.error in tests unless DEBUG is set
if (!process.env.DEBUG) {
  globalThis.console.error = () => {};
}
