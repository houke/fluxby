import { describe, it, expect } from 'vitest';

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
});
