import { afterEach, describe, expect, it } from 'vitest';
import {
  getCalendarMonthRange,
  isStaleSubscription,
  getSubscriptionReminders,
} from '@/lib/subscription-calendar';

const originalTimezone = process.env.TZ;
afterEach(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

describe('subscription calendar dates', () => {
  it.each(['Europe/Amsterdam', 'America/Los_Angeles', 'UTC'])(
    'keeps September boundaries in %s',
    (timezone) => {
      process.env.TZ = timezone;
      expect(getCalendarMonthRange(new Date(2026, 8, 15))).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });
    }
  );

  it('handles leap years and year boundaries', () => {
    expect(getCalendarMonthRange(new Date(2024, 1, 15))).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
    expect(getCalendarMonthRange(new Date(2026, 11, 15))).toEqual({
      startDate: '2026-12-01',
      endDate: '2026-12-31',
    });
  });
});

describe('subscription inactivity', () => {
  it('keeps annual and quarterly subscriptions active between expected payments', () => {
    expect(
      isStaleSubscription(
        { patternType: 'yearly', lastDate: '2026-01-01' },
        '2026-09-30'
      )
    ).toBe(false);
    expect(
      isStaleSubscription(
        { patternType: 'quarterly', lastDate: '2026-07-01' },
        '2026-09-30'
      )
    ).toBe(false);
  });

  it('flags missed cycles using the subscription cadence and allows payment tolerance', () => {
    expect(
      isStaleSubscription(
        { patternType: 'monthly', lastDate: '2026-06-01' },
        '2026-09-30'
      )
    ).toBe(true);
    expect(
      isStaleSubscription(
        { patternType: 'weekly', lastDate: '2026-09-01' },
        '2026-09-30'
      )
    ).toBe(false);
    expect(
      isStaleSubscription(
        { patternType: 'weekly', lastDate: '2026-09-01' },
        '2026-10-02'
      )
    ).toBe(true);
  });
});

describe('subscription renewal reminders', () => {
  it('reminds about dates in the next 30 days, including an overdue cancellation deadline', () => {
    expect(
      getSubscriptionReminders(
        { renewalDate: '2026-10-15', cancellationDeadline: '2026-09-28' },
        '2026-09-29'
      )
    ).toEqual(['renewal', 'cancellation']);
    expect(
      getSubscriptionReminders(
        { renewalDate: '2026-11-01', cancellationDeadline: '2026-11-01' },
        '2026-09-29'
      )
    ).toEqual([]);
    expect(
      getSubscriptionReminders({ renewalDate: '2026-09-01' }, '2026-09-29')
    ).toEqual([]);
  });
});
