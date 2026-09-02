import { describe, expect, it } from 'vitest';
import { FormatDatePipe } from './format-date.pipe';

describe('FormatDatePipe', () => {
  it('formats an ISO date as dd/mm', () => {
    expect(new FormatDatePipe().transform('2026-07-05')).toBe('05/07');
  });

  it('pads single-digit day and month', () => {
    expect(new FormatDatePipe().transform('2026-01-09')).toBe('09/01');
  });
});
