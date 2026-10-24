import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});
