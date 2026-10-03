import type { CSSProperties } from 'react';

/** Use a saved account swatch with the more readable black/white foreground. */
export function getAccountIconStyle(
  color?: string | null
): CSSProperties | undefined {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return undefined;
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return {
    backgroundColor: color,
    color: luminance > 0.179 ? '#000000' : '#ffffff',
  };
}
