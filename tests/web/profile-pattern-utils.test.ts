/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { mergePatternOptions } from '@/components/settings/profile-pattern-utils';

describe('mergePatternOptions', () => {
  it('keeps the pinned pattern at the front and preserves the selected option', () => {
    const pinned = 'linear-gradient(45deg, #fff, #000)';
    const selected = 'linear-gradient(90deg, #111, #222)';
    const generated = [pinned, selected, 'linear-gradient(180deg, #333, #444)'];

    const result = mergePatternOptions(pinned, generated, selected, 4);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(pinned);
    expect(result[1]).toBe(selected);
    expect(result).toEqual([
      pinned,
      selected,
      'linear-gradient(180deg, #333, #444)',
    ]);
  });

  it('drops duplicates and respects the target length', () => {
    const pinned = 'linear-gradient(15deg, #aaa, #bbb)';
    const generated = [
      pinned,
      'linear-gradient(120deg, #ccc, #ddd)',
      'linear-gradient(120deg, #ccc, #ddd)',
      'linear-gradient(300deg, #eee, #fff)',
    ];

    const result = mergePatternOptions(pinned, generated, undefined, 3);

    expect(result).toEqual([
      pinned,
      'linear-gradient(120deg, #ccc, #ddd)',
      'linear-gradient(300deg, #eee, #fff)',
    ]);
  });

  it('falls back to generated patterns when no current selection is provided', () => {
    const generated = [
      'linear-gradient(10deg, #123, #456)',
      'linear-gradient(210deg, #789, #abc)',
      'linear-gradient(310deg, #def, #012)',
    ];

    const result = mergePatternOptions(null, generated, undefined, 2);

    expect(result).toEqual(generated.slice(0, 2));
  });

  it('ignores non-gradient pinned or selected values', () => {
    const generated = [
      'linear-gradient(15deg, #000, #111)',
      'linear-gradient(30deg, #222, #333)',
    ];

    const result = mergePatternOptions(
      'https://example.com/avatar.png',
      generated,
      'plain-color'
    );

    expect(result).toEqual(generated);
  });
});
