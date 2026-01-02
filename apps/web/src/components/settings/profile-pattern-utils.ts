/**
 * Avatar pattern helpers used in the profile manager.
 * These utilities ensure that gradient patterns stay visible and consistently
 * ordered when refreshing or selecting new options.
 */

export function isGradientPattern(pattern: unknown): pattern is string {
  return typeof pattern === 'string' && pattern.startsWith('linear-gradient');
}

/**
 * Merge the pinned (current) pattern, an optional selected pattern, and the
 * freshly generated list while keeping the pinned pattern at the front.
 * Duplicate gradient entries are removed while preserving the encounter order.
 */
export function mergePatternOptions(
  pinnedPattern: string | null | undefined,
  generatedPatterns: string[],
  selectedPattern?: string | null | undefined,
  targetLength?: number
): string[] {
  const limit = targetLength && targetLength > 0 ? targetLength : undefined;
  const result: string[] = [];

  const pushUnique = (pattern: string | null | undefined) => {
    if (!isGradientPattern(pattern)) return;
    if (result.includes(pattern)) return;
    result.push(pattern);
  };

  pushUnique(pinnedPattern);
  pushUnique(selectedPattern);

  for (const candidate of generatedPatterns) {
    if (limit && result.length >= limit) {
      break;
    }
    pushUnique(candidate);
  }

  if (limit && result.length > limit) {
    return result.slice(0, limit);
  }

  return result;
}
