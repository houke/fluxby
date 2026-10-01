import { describe, it, expect } from 'vitest';
import {
  DEFAULT_IMPORT_OPTIONS,
  parseImportDate,
  parseImportAmount,
  parseConfiguredCSV,
  prepareConfiguredImport,
  headerSignature,
} from '@/lib/importers/import-options';
import { merchantSimilarity } from '@/lib/data/import-tools';
import { parseASNAmount, parseASNDate } from '@/lib/importers/asn-importer';

const options = DEFAULT_IMPORT_OPTIONS;
describe('Dutch import normalization', () => {
  it('strictly validates Dutch money and real calendar dates', () => {
    expect(parseImportAmount('€ 1.234,56', ',')).toBe(1234.56);
    expect(parseImportAmount('-1,234.56', '.')).toBe(-1234.56);
    expect(() => parseImportAmount('12.34', ',')).toThrow();
    expect(() => parseImportAmount('12abc', ',')).toThrow();
    expect(parseImportDate('29-02-2024', 'day-first')).toBe('2024-02-29');
    expect(() => parseImportDate('29-02-2025', 'day-first')).toThrow();
    expect(() => parseImportDate('31-04-2026', 'auto')).toThrow();
  });
  it('normalizes representative Rabobank CSV and preserves SEPA source fields', () => {
    const source =
      'IBAN/BBAN;Datum;Bedrag;Naam tegenpartij;Machtigingskenmerk;Incassant ID;Omschrijving-1\nNL91RABO0315273637;2026-09-30;-24,95;Waterbedrijf;MANDATE-7;NL11ZZZ123456780000;Water';
    const result = prepareConfiguredImport(
      source,
      {
        date: 'Datum',
        amount: 'Bedrag',
        description: 'Naam tegenpartij',
        iban: 'IBAN/BBAN',
      },
      options
    );
    expect(result.rows[0].__fluxby_amount).toBe('-24,95');
    expect(result.rows[0]['Machtigingskenmerk']).toBe('MANDATE-7');
    expect(result.rows[0]['Incassant ID']).toBe('NL11ZZZ123456780000');
    expect(result.mapping.direction).toBeUndefined();
  });
  it('recognizes representative seven-column ABN AMRO tab export and rejects foreign currency', () => {
    const custom = {
      ...options,
      delimiter: '\t' as const,
      decimal: '.' as const,
    };
    const source =
      '123456789\tEUR\t20260930\t100.00\t87.50\t-12.50\tSupermarkt';
    const parsed = parseConfiguredCSV(source, custom);
    expect(parsed.headers).toContain('Transactiedatum');
    const result = prepareConfiguredImport(
      source,
      {
        date: 'Transactiedatum',
        amount: 'Transactiebedrag',
        description: 'Omschrijving',
        balance: 'Eindsaldo',
      },
      custom
    );
    expect(result.rows[0].__fluxby_amount).toBe('-12,50');
    expect(result.rows[0].__fluxby_balance).toBe('87,50');
    expect(() =>
      parseConfiguredCSV(source.replace('EUR', 'USD'), custom)
    ).toThrow('currency');
  });
  it('keeps normalized values compatible with the ASN bank parser', () => {
    const result = prepareConfiguredImport(
      'Datum;Bedrag bij / af;Omschrijving\n30-09-2026;-1.234,56;Test',
      { date: 'Datum', amount: 'Bedrag bij / af', description: 'Omschrijving' },
      options
    );
    expect(parseASNAmount(result.rows[0].__fluxby_amount)).toBe(-1234.56);
    // The importer falls back to its ISO-aware date helper for normalized dates.
    expect(parseASNDate('30-09-2026')).toBe('2026-09-30');
  });
  it('supports skipped introductory records, multiline fields and debit/credit columns', () => {
    const custom = {
      ...options,
      skipRows: 1,
      delimiter: ';' as const,
      debitColumn: 'Af',
      creditColumn: 'Bij',
    };
    const source =
      'Export\nDatum;Af;Bij;Omschrijving\n30-09-2026;12,50;;"Supermarkt\nAmsterdam"\n01-10-2026;;2500,00;Salaris';
    const result = prepareConfiguredImport(
      source,
      { date: 'Datum', amount: '', description: 'Omschrijving' },
      custom
    );
    expect(result.rows.map((r) => r.__fluxby_amount)).toEqual([
      '-12,50',
      '2500,00',
    ]);
    expect(result.rows[0].Omschrijving).toContain('\n');
    expect(() =>
      prepareConfiguredImport(
        'Datum;Af;Bij;Omschrijving\n30-09-2026;10,00;10,00;Test',
        { date: 'Datum', amount: '', description: 'Omschrijving' },
        { ...custom, skipRows: 0 }
      )
    ).toThrow();
  });
  it('rejects malformed CSV and ambiguous headers instead of silently shifting fields', () => {
    expect(() => parseConfiguredCSV('Datum;Datum\n1;2', options)).toThrow();
    expect(() => parseConfiguredCSV('Datum;Bedrag\n1;2;3', options)).toThrow();
    expect(headerSignature([' Datum ', 'Bedrag'])).toBe(
      headerSignature(['datum', 'BEDRAG'])
    );
  });
  it('uses offline merchant similarity only as a candidate signal', () => {
    expect(
      merchantSimilarity('Albert Heijn Amsterdam', 'ALBERT HEIJN AMSTERDAM')
    ).toBe(1);
    expect(merchantSimilarity('', '')).toBe(0);
    expect(merchantSimilarity('NS treinkaartje', 'Waterbedrijf incasso')).toBe(
      0
    );
  });
});
