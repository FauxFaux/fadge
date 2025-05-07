import { describe, it, expect } from 'vitest';
import { longestCommonPrefix } from '../src/dosh';

describe('lcp', () => {
  it('handles empty', () => {
    expect(longestCommonPrefix([])).toBe('/');
  })

  it('finds', () => {
    expect(longestCommonPrefix(['/home/foo', '/home/bar'])).toBe('/home/');
    expect(longestCommonPrefix(['/home/foo/one', '/home/foo/two', '/home/bar'])).toBe('/home/');
    expect(longestCommonPrefix(['/home/foo', '/home/food'])).toBe('/home/');
  });
})
