import { describe, it, expect } from 'vitest';
import { PATTERN_INTERVALS, DATE_TOLERANCE_DAYS } from '@fluxby/shared';

describe('Subscription Amount Clustering', () => {
  /**
   * Helper function to simulate the clustering algorithm
   * Groups transactions by similar amounts (within 15% threshold)
   */
  function clusterByAmount(
    transactions: Array<{ date: string; amount: number }>,
    threshold = 0.15
  ): Array<Array<{ date: string; amount: number }>> {
    const clusters: Array<Array<{ date: string; amount: number }>> = [];

    for (const tx of transactions) {
      const absAmount = Math.abs(tx.amount);
      let foundCluster = false;

      for (const cluster of clusters) {
        const clusterAvgAbs = Math.abs(
          cluster.reduce((sum, t) => sum + t.amount, 0) / cluster.length
        );

        if (Math.abs(absAmount - clusterAvgAbs) / clusterAvgAbs <= threshold) {
          cluster.push(tx);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push([tx]);
      }
    }

    return clusters;
  }

  /**
   * Helper to simulate full pattern detection with interval checks
   */
  function detectPattern(transactions: Array<{ date: string; amount: number }>): {
    patternType: string | null;
    isConsistent: boolean;
    avgInterval: number;
    intervals: number[];
    daySpan: number;
    error?: string;
  } {
    // Sort by date
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dates = sorted.map((t) => new Date(t.date));

    // Calculate day span
    const daySpan = Math.round(
      (dates[dates.length - 1].getTime() - dates[0].getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daySpan < 60) {
      return {
        patternType: null,
        isConsistent: false,
        avgInterval: 0,
        intervals: [],
        daySpan,
        error: `Day span ${daySpan} < 60 required`,
      };
    }

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = Math.round(
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }

    const avgInterval =
      intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

    // Find pattern type
    let patternType: string | null = null;
    for (const [type, range] of Object.entries(PATTERN_INTERVALS)) {
      if (avgInterval >= range.min && avgInterval <= range.max) {
        patternType = type;
        break;
      }
    }

    if (!patternType) {
      return {
        patternType: null,
        isConsistent: false,
        avgInterval,
        intervals,
        daySpan,
        error: `Average interval ${avgInterval.toFixed(1)} doesn't match any pattern type`,
      };
    }

    // Check consistency
    const isConsistent = intervals.every(
      (interval) => Math.abs(interval - avgInterval) <= DATE_TOLERANCE_DAYS
    );

    return { patternType, isConsistent, avgInterval, intervals, daySpan };
  }

  it('should separate two different subscription amounts from same merchant', () => {
    const transactions = [
      { date: '2025-09-30', amount: -16.6 },
      { date: '2025-10-31', amount: -41.38 },
      { date: '2025-10-31', amount: -16.6 },
      { date: '2025-11-28', amount: -41.39 },
      { date: '2025-11-28', amount: -16.6 },
      { date: '2025-12-31', amount: -41.38 },
      { date: '2025-12-31', amount: -16.6 },
    ];

    const clusters = clusterByAmount(transactions);

    expect(clusters).toHaveLength(2);

    // Find the €16.60 cluster
    const cheapCluster = clusters.find((c) =>
      c.every((t) => Math.abs(t.amount) < 20)
    );
    expect(cheapCluster).toBeDefined();
    expect(cheapCluster).toHaveLength(4);

    // Find the €41.38 cluster
    const expensiveCluster = clusters.find((c) =>
      c.every((t) => Math.abs(t.amount) > 40)
    );
    expect(expensiveCluster).toBeDefined();
    expect(expensiveCluster).toHaveLength(3);
  });

  it('should group similar amounts with minor variations', () => {
    const transactions = [
      { date: '2025-01-01', amount: -9.99 },
      { date: '2025-02-01', amount: -10.0 },
      { date: '2025-03-01', amount: -10.01 },
      { date: '2025-04-01', amount: -9.98 },
    ];

    const clusters = clusterByAmount(transactions);

    // All should be in one cluster (variations < 15%)
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(4);
  });

  it('should separate price increases into different clusters', () => {
    const transactions = [
      { date: '2025-01-01', amount: -9.99 },
      { date: '2025-02-01', amount: -9.99 },
      { date: '2025-03-01', amount: -9.99 },
      { date: '2025-04-01', amount: -14.99 }, // 50% price increase
    ];

    const clusters = clusterByAmount(transactions);

    // Should create two clusters due to large price difference
    expect(clusters).toHaveLength(2);

    const oldPriceCluster = clusters.find((c) =>
      c.every((t) => Math.abs(t.amount) < 11)
    );
    expect(oldPriceCluster).toHaveLength(3);

    const newPriceCluster = clusters.find((c) =>
      c.every((t) => Math.abs(t.amount) > 14)
    );
    expect(newPriceCluster).toHaveLength(1);
  });

  it('should handle Netflix-like scenario with multiple tiers', () => {
    const transactions = [
      // Basic plan €7.99
      { date: '2025-01-01', amount: -7.99 },
      { date: '2025-02-01', amount: -7.99 },
      { date: '2025-03-01', amount: -7.99 },
      // Standard plan €13.49
      { date: '2025-01-01', amount: -13.49 },
      { date: '2025-02-01', amount: -13.49 },
      { date: '2025-03-01', amount: -13.49 },
      // Premium plan €17.99
      { date: '2025-01-01', amount: -17.99 },
      { date: '2025-02-01', amount: -17.99 },
      { date: '2025-03-01', amount: -17.99 },
    ];

    const clusters = clusterByAmount(transactions);

    // Should create 3 separate clusters
    expect(clusters).toHaveLength(3);

    // Each cluster should have 3 transactions
    clusters.forEach((cluster) => {
      expect(cluster).toHaveLength(3);
    });
  });

  it('should cluster amounts progressively based on running average', () => {
    // This tests the actual clustering behavior:
    // - First tx (€10) creates cluster with avg €10
    // - Second tx (€11.4) is +14% from €10, added to cluster (new avg: €10.7)
    // - Third tx (€8.6) is -19.6% from €10.7, exceeds 15% threshold -> new cluster
    const transactions = [
      { date: '2025-01-01', amount: -10.0 },
      { date: '2025-02-01', amount: -11.4 }, // +14% from €10
      { date: '2025-03-01', amount: -8.6 }, // -19.6% from avg €10.7
    ];

    const clusters = clusterByAmount(transactions);

    // Creates two clusters because €8.6 is too far from running average
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toHaveLength(2); // €10 and €11.4
    expect(clusters[1]).toHaveLength(1); // €8.6
  });

  it('should split amounts exceeding 15% threshold', () => {
    const transactions = [
      { date: '2025-01-01', amount: -10.0 },
      { date: '2025-02-01', amount: -11.6 }, // +16% (exceeds threshold)
    ];

    const clusters = clusterByAmount(transactions);

    // Should create two separate clusters
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toHaveLength(1);
    expect(clusters[1]).toHaveLength(1);
  });

  it('should detect €20 monthly subscription (user bug report)', () => {
    // Exact user scenario: €20 on 10th of each month
    const transactions = [
      { date: '2025-06-10', amount: -20.0 },
      { date: '2025-07-10', amount: -20.0 },
      { date: '2025-08-11', amount: -20.0 }, // One day late
      { date: '2025-09-10', amount: -20.0 },
      { date: '2025-10-10', amount: -20.0 },
      { date: '2025-11-10', amount: -20.0 },
      { date: '2025-12-10', amount: -20.0 },
    ];

    const result = detectPattern(transactions);

    // Should be detected as monthly
    expect(result.patternType).toBe('monthly');
    expect(result.isConsistent).toBe(true);
    expect(result.daySpan).toBeGreaterThanOrEqual(60);
    expect(result.avgInterval).toBeGreaterThanOrEqual(27);
    expect(result.avgInterval).toBeLessThanOrEqual(34);
    expect(result.error).toBeUndefined();
  });

  it('should accept intervals with up to 12 day tolerance', () => {
    // Test edge case: intervals that vary but should still pass
    const transactions = [
      { date: '2025-01-01', amount: -10.0 },
      { date: '2025-01-25', amount: -10.0 }, // 24 days (shorter)
      { date: '2025-02-28', amount: -10.0 }, // 34 days (longer)
      { date: '2025-03-28', amount: -10.0 }, // 28 days
    ];

    const result = detectPattern(transactions);

    // Avg is ~28.67 days, intervals are 24, 34, 28
    // 24 is 4.67 days from avg (within 12)
    // 34 is 5.33 days from avg (within 12)
    // 28 is 0.67 days from avg (within 12)
    expect(result.patternType).toBe('monthly');
    expect(result.isConsistent).toBe(true);
  });
});
