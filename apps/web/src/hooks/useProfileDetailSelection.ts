import { useCallback, useEffect, useState, type SetStateAction } from 'react';

/** Keep an expanded detail tied to the profile that opened it. */
export function useProfileDetailSelection(profileId: string | null) {
  const [selection, setSelection] = useState<{
    profileId: string | null;
    id: string | null;
  } | null>(null);
  const selectedId = selection?.profileId === profileId ? selection.id : null;

  useEffect(() => setSelection(null), [profileId]);
  const setSelectedId = useCallback(
    (value: SetStateAction<string | null>) => {
      setSelection((previous) => {
        const currentId =
          previous?.profileId === profileId ? previous.id : null;
        return {
          profileId,
          id: typeof value === 'function' ? value(currentId) : value,
        };
      });
    },
    [profileId]
  );

  return [selectedId, setSelectedId] as const;
}

/** Reset paged details before a different contact or profile can render. */
export function useProfileDetailPage(
  profileId: string | null,
  detailId: string | null
) {
  const [selection, setSelection] = useState({ profileId, detailId, page: 0 });
  const page =
    selection.profileId === profileId && selection.detailId === detailId
      ? selection.page
      : 0;

  useEffect(
    () => setSelection({ profileId, detailId, page: 0 }),
    [profileId, detailId]
  );
  const setPage = useCallback(
    (page: number) => setSelection({ profileId, detailId, page }),
    [profileId, detailId]
  );

  return [page, setPage] as const;
}
