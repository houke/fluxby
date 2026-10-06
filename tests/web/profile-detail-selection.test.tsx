/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  useProfileDetailSelection,
  useProfileDetailPage,
} from '@/hooks/useProfileDetailSelection';

describe('Profile detail selection', () => {
  it('hides a previous detail before rendering another profile and does not revive it when switching back', () => {
    const renderedIds: Array<string | null> = [];
    const { result, rerender } = renderHook(
      ({ profileId }) => {
        const selected = useProfileDetailSelection(profileId);
        renderedIds.push(selected[0]);
        return selected;
      },
      { initialProps: { profileId: 'profile-one' as string | null } }
    );
    act(() => result.current[1]('contact-one'));
    expect(result.current[0]).toBe('contact-one');
    renderedIds.length = 0;
    rerender({ profileId: 'profile-two' });
    expect(renderedIds).not.toContain('contact-one');
    expect(result.current[0]).toBeNull();
    rerender({ profileId: 'profile-one' });
    expect(result.current[0]).toBeNull();
    act(() => result.current[1]('contact-one'));
    rerender({ profileId: null });
    expect(result.current[0]).toBeNull();
  });

  it('supports toggling details without reading a selection owned by a different profile', () => {
    const { result, rerender } = renderHook(
      ({ profileId }) => useProfileDetailSelection(profileId),
      {
        initialProps: { profileId: 'profile-one' },
      }
    );
    const toggle = (id: string) =>
      act(() => result.current[1]((previous) => (previous === id ? null : id)));
    toggle('pattern-one');
    expect(result.current[0]).toBe('pattern-one');
    toggle('pattern-one');
    expect(result.current[0]).toBeNull();
    toggle('pattern-one');
    rerender({ profileId: 'profile-two' });
    toggle('pattern-two');
    expect(result.current[0]).toBe('pattern-two');
  });
});

describe('Profile detail page', () => {
  it('resets before the first render for another contact, another profile, or a collapsed detail', () => {
    const renderedPages: number[] = [];
    const { result, rerender } = renderHook(
      ({ profileId, detailId }) => {
        const pagination = useProfileDetailPage(profileId, detailId);
        renderedPages.push(pagination[0]);
        return pagination;
      },
      {
        initialProps: {
          profileId: 'profile-one',
          detailId: 'contact-one' as string | null,
        },
      }
    );
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(3);
    renderedPages.length = 0;
    rerender({ profileId: 'profile-one', detailId: 'contact-two' });
    expect(renderedPages.every((page) => page === 0)).toBe(true);
    act(() => result.current[1](2));
    renderedPages.length = 0;
    rerender({ profileId: 'profile-two', detailId: 'contact-two' });
    expect(renderedPages.every((page) => page === 0)).toBe(true);
    rerender({ profileId: 'profile-one', detailId: 'contact-two' });
    expect(result.current[0]).toBe(0);
    act(() => result.current[1](3));
    renderedPages.length = 0;
    rerender({ profileId: 'profile-one', detailId: null });
    expect(renderedPages.every((page) => page === 0)).toBe(true);
    rerender({ profileId: 'profile-one', detailId: 'contact-two' });
    expect(result.current[0]).toBe(0);
  });
});
