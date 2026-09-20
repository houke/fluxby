import type { SetURLSearchParams } from 'react-router-dom';

export const createSettingsTabHandler = (
  setSearchParams: SetURLSearchParams
) => {
  return (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
    window.scrollTo({ top: 0 });
  };
};
