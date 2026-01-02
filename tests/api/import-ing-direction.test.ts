import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';
import { run, queryOne, query } from '../../apps/api/src/db';

describe('ING Import with Direction Column', () => {
  let profileId: number;

  beforeEach(() => {
    // Reset DB
    run('DELETE FROM accounts');
    run('DELETE FROM transactions');
    run('DELETE FROM profiles');

    // Create profile
    const result = run('INSERT INTO profiles (name, type) VALUES (?, ?)', [
      'Test Profile',
      'personal',
    ]);
    profileId = result.lastInsertRowid as number;
  });

  it('should correctly import ING CSV with tab-separated format', async () => {
    // Simulate an ING CSV file with tab-separated columns
    const csvContent = `Datum\tNaam / Omschrijving\tRekening\tTegenrekening\tCode\tAf Bij\tBedrag (EUR)\tMutatiesoort\tMededelingen\tSaldo na mutatie\tTag
20251221\tSumUp  *Fixphoneambach Ambacht\tNL63INGB0796948461\t\tBA\tAf\t1,00\tBetaalautomaat\tPasvolgnr: 900 20-12-2025 12:21 Transactie: W00319 Term: MTYXEHHM Google Pay Valutadatum: 21-12-2025\t85,33\t
20251220\tAlbert Heijn 1234\tNL63INGB0796948461\t\tBA\tAf\t50,25\tBetaalautomaat\tPasvolgnr: 900 20-12-2025 14:30\t135,58\t
20251219\tSalary Payment\tNL63INGB0796948461\tNL01RABO0123456789\tOV\tBij\t2500,00\tOverschrijving\tSalary December 2025\t185,83\t`;

    const mapping = JSON.stringify({
      date: 'Datum',
      amount: 'Bedrag (EUR)',
      description: 'Naam / Omschrijving',
      iban: 'Rekening',
      counterparty: 'Tegenrekening',
      balance: 'Saldo na mutatie',
      direction: 'Af Bij',
      paymentMethod: 'Mutatiesoort',
      notes: 'Mededelingen',
    });

    const response = await request(app)
      .post('/api/import/generic/import')
      .set('X-Profile-ID', String(profileId))
      .field('mapping', mapping)
      .field('bank', 'ing')
      .attach('file', Buffer.from(csvContent), 'test.csv');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Check if account was created
    const account = queryOne<{ id: number; name: string; iban: string }>(
      'SELECT * FROM accounts WHERE iban = ? AND profile_id = ?',
      ['NL63INGB0796948461', profileId]
    );
    expect(account).toBeDefined();

    // Check transactions were imported with correct amounts
    const transactions = query<{
      description: string;
      amount: number;
      type: string;
    }>(
      'SELECT description, amount, type FROM transactions WHERE account_id = ? AND profile_id = ? ORDER BY date DESC, amount',
      [account?.id, profileId]
    );

    expect(transactions.length).toBe(3);

    // First transaction: SumUp - expense (Af) = negative amount
    const sumupTx = transactions.find((t) => t.description.includes('SumUp'));
    expect(sumupTx).toBeDefined();
    expect(sumupTx?.amount).toBe(-1.0); // Should be negative
    expect(sumupTx?.type).toBe('expense');

    // Second transaction: Albert Heijn - expense (Af) = negative amount
    const ahTx = transactions.find((t) =>
      t.description.includes('Albert Heijn')
    );
    expect(ahTx).toBeDefined();
    expect(ahTx?.amount).toBe(-50.25); // Should be negative
    expect(ahTx?.type).toBe('expense');

    // Third transaction: Salary - income (Bij) = positive amount
    const salaryTx = transactions.find((t) =>
      t.description.includes('Salary Payment')
    );
    expect(salaryTx).toBeDefined();
    expect(salaryTx?.amount).toBe(2500.0); // Should be positive
    expect(salaryTx?.type).toBe('income');
  });

  it('should handle direction field mapping for ING imports', async () => {
    // Test with explicit direction column mapping
    const csvContent = `Datum\tNaam / Omschrijving\tRekening\tTegenrekening\tCode\tAf Bij\tBedrag (EUR)\tMutatiesoort\tMededelingen\tSaldo na mutatie
20251221\tTest Expense\tNL63INGB0796948461\t\tBA\tAf\t10,00\tBetaalautomaat\tTest\t90,00
20251221\tTest Income\tNL63INGB0796948461\t\tOV\tBij\t20,00\tOverschrijving\tTest\t110,00`;

    const mapping = JSON.stringify({
      date: 'Datum',
      amount: 'Bedrag (EUR)',
      description: 'Naam / Omschrijving',
      iban: 'Rekening',
      counterparty: 'Tegenrekening',
      direction: 'Af Bij', // Explicit mapping of direction column
    });

    const response = await request(app)
      .post('/api/import/generic/import')
      .set('X-Profile-ID', String(profileId))
      .field('mapping', mapping)
      .field('bank', 'ing')
      .attach('file', Buffer.from(csvContent), 'test.csv');

    expect(response.status).toBe(200);

    const transactions = query<{ description: string; amount: number }>(
      'SELECT description, amount FROM transactions WHERE profile_id = ? ORDER BY date, amount',
      [profileId]
    );

    expect(transactions.length).toBe(2);
    expect(transactions[0].amount).toBe(-10.0); // Af = expense = negative
    expect(transactions[1].amount).toBe(20.0); // Bij = income = positive
  });
});
