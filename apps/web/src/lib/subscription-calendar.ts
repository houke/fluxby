import {
  diffDateOnlyInDays,
  formatDateISO,
  PATTERN_INTERVALS,
  DATE_TOLERANCE_DAYS,
  type RecurringPattern,
} from '@fluxby/shared';

/** Calendar dates stay in the user's month instead of shifting through UTC. */
export function getCalendarMonthRange(date: Date) {
  return {
    startDate: formatDateISO(new Date(date.getFullYear(), date.getMonth(), 1)),
    endDate: formatDateISO(
      new Date(date.getFullYear(), date.getMonth() + 1, 0)
    ),
  };
}

/** Wait two complete expected cycles before flagging an inactive subscription. */
export function isStaleSubscription(
  pattern: Pick<RecurringPattern, 'lastDate' | 'patternType'>,
  today: string = formatDateISO(new Date())
): boolean {
  if (!pattern.lastDate) return false;
  const staleAfter =
    PATTERN_INTERVALS[pattern.patternType].max * 2 + DATE_TOLERANCE_DAYS;
  return diffDateOnlyInDays(pattern.lastDate, today) > staleAfter;
}

export function getSubscriptionReminders(
  pattern: Pick<RecurringPattern, 'renewalDate' | 'cancellationDeadline'>,
  today: string = formatDateISO(new Date())
): ('renewal' | 'cancellation')[] {
  const reminders: ('renewal' | 'cancellation')[] = [];
  if (pattern.renewalDate) {
    const days = diffDateOnlyInDays(today, pattern.renewalDate);
    if (days >= 0 && days <= 30) reminders.push('renewal');
  }
  if (
    pattern.cancellationDeadline &&
    diffDateOnlyInDays(today, pattern.cancellationDeadline) <= 30
  ) {
    reminders.push('cancellation');
  }
  return reminders;
}
