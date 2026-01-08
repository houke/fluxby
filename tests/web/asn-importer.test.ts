import { describe, it, expect } from 'vitest';
import {
  parseASNAmount,
  parseASNDate,
  mapASNPaymentType,
} from '../../apps/web/src/lib/importers/asn-importer';
import { parseGenericCSV } from '@fluxby/core';

describe('ASN Bank Integration', () => {
  describe('parseASNAmount', () => {
    it('parses positive amount without thousands separator', () => {
      expect(parseASNAmount('10,50')).toBe(10.5);
    });

    it('parses negative amount without thousands separator', () => {
      expect(parseASNAmount('-10,50')).toBe(-10.5);
    });

    it('parses large positive amount with thousands separator', () => {
      expect(parseASNAmount('1.250,00')).toBe(1250);
    });

    it('parses large negative amount with thousands separator', () => {
      expect(parseASNAmount('-1.250,00')).toBe(-1250);
    });

    it('parses very large amount with multiple thousands separators', () => {
      expect(parseASNAmount('1.234.567,89')).toBe(1234567.89);
    });

    it('parses whole number amount', () => {
      expect(parseASNAmount('100,00')).toBe(100);
    });

    it('returns null for empty string', () => {
      expect(parseASNAmount('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseASNAmount(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(parseASNAmount(undefined)).toBeNull();
    });

    it('handles amount with whitespace', () => {
      expect(parseASNAmount(' 10,50 ')).toBe(10.5);
    });

    it('handles negative amount with whitespace after minus', () => {
      expect(parseASNAmount('- 10,50')).toBe(-10.5);
    });
  });

  describe('parseASNDate', () => {
    it('parses DD-MM-YYYY format', () => {
      expect(parseASNDate('25-12-2024')).toBe('2024-12-25');
    });

    it('parses D-M-YYYY format (single digit day/month)', () => {
      expect(parseASNDate('5-1-2024')).toBe('2024-01-05');
    });

    it('parses DD/MM/YYYY format with slashes', () => {
      expect(parseASNDate('25/12/2024')).toBe('2024-12-25');
    });

    it('handles whitespace', () => {
      expect(parseASNDate(' 25-12-2024 ')).toBe('2024-12-25');
    });

    it('returns null for empty string', () => {
      expect(parseASNDate('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseASNDate(null)).toBeNull();
    });

    it('returns null for invalid date format', () => {
      expect(parseASNDate('2024-12-25')).toBeNull(); // YYYY-MM-DD not supported
    });

    it('returns null for invalid month', () => {
      expect(parseASNDate('25-13-2024')).toBeNull();
    });

    it('returns null for invalid day', () => {
      expect(parseASNDate('32-12-2024')).toBeNull();
    });
  });

  describe('mapASNPaymentType', () => {
    it('maps iom to incasso', () => {
      expect(mapASNPaymentType('iom')).toBe('incasso');
    });

    it('maps ic to incasso', () => {
      expect(mapASNPaymentType('ic')).toBe('incasso');
    });

    it('maps ovs to overschrijving', () => {
      expect(mapASNPaymentType('ovs')).toBe('overschrijving');
    });

    it('maps ngo to overschrijving', () => {
      expect(mapASNPaymentType('ngo')).toBe('overschrijving');
    });

    it('maps afb to overschrijving', () => {
      expect(mapASNPaymentType('afb')).toBe('overschrijving');
    });

    it('maps bea to pin', () => {
      expect(mapASNPaymentType('bea')).toBe('pin');
    });

    it('maps gea to geldautomaat', () => {
      expect(mapASNPaymentType('gea')).toBe('geldautomaat');
    });

    it('handles uppercase input', () => {
      expect(mapASNPaymentType('IOM')).toBe('incasso');
    });

    it('handles mixed case input', () => {
      expect(mapASNPaymentType('Ovs')).toBe('overschrijving');
    });

    it('handles whitespace', () => {
      expect(mapASNPaymentType(' iom ')).toBe('incasso');
    });

    it('returns overig for unknown type', () => {
      expect(mapASNPaymentType('xyz')).toBe('overig');
    });

    it('returns overig for empty string', () => {
      expect(mapASNPaymentType('')).toBe('overig');
    });

    it('returns overig for null', () => {
      expect(mapASNPaymentType(null)).toBe('overig');
    });

    it('returns overig for undefined', () => {
      expect(mapASNPaymentType(undefined)).toBe('overig');
    });
  });

  describe('ASN CSV delimiter detection', () => {
    it('detects semicolon delimiter in ASN format', () => {
      const csv = `"Datum";"Je rekening";"Van / naar";"Naam";"Saldo voor boeking";"Bedrag bij / af";"Type";"Omschrijving"
"01-01-2024";"NL91ASNB0123456789";"NL01TEST9876543210";"Test Shop";"1.000,00";"10,50";"bea";"Betaling voor aankoop"`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Datum');
      expect(result.headers).toContain('Saldo voor boeking');
      expect(result.headers).toContain('Bedrag bij / af');
      expect(result.totalRows).toBe(1);
    });

    it('detects comma delimiter when ASN file uses commas', () => {
      const csv = `"Datum","Je rekening","Van / naar","Naam","Saldo voor boeking","Bedrag bij / af","Type","Omschrijving"
"01-01-2024","NL91ASNB0123456789","NL01TEST9876543210","Test Shop","1000.00","10.50","bea","Betaling voor aankoop"`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Datum');
      expect(result.headers).toContain('Saldo voor boeking');
      expect(result.headers).toContain('Bedrag bij / af');
      expect(result.totalRows).toBe(1);
    });
  });

  describe('ASN bank detection', () => {
    it('identifies ASN format by signature headers', () => {
      const headers = [
        'Datum',
        'Je rekening',
        'Van / naar',
        'Naam',
        'Saldo voor boeking',
        'Bedrag bij / af',
        'Type',
        'Omschrijving',
      ];
      const headersLower = headers.map((h) => h.toLowerCase());

      // ASN signature: both "Saldo voor boeking" AND "Bedrag bij / af"
      const isASN =
        headersLower.includes('saldo voor boeking') &&
        headersLower.includes('bedrag bij / af');

      expect(isASN).toBe(true);
    });

    it('does not identify ING format as ASN', () => {
      const headers = [
        'Datum',
        'Naam / Omschrijving',
        'Rekening',
        'Tegenrekening',
        'Code',
        'Af Bij',
        'Bedrag (EUR)',
        'Mutatiesoort',
        'Mededelingen',
        'Saldo na mutatie',
      ];
      const headersLower = headers.map((h) => h.toLowerCase());

      const isASN =
        headersLower.includes('saldo voor boeking') &&
        headersLower.includes('bedrag bij / af');

      expect(isASN).toBe(false);
    });
  });

  describe('Full ASN CSV parsing', () => {
    it('parses complete ASN CSV row correctly', () => {
      const csv = `"Datum";"Je rekening";"Van / naar";"Naam";"Adres";"Postcode";"Woonplaats";"Valuta saldo";"Saldo voor boeking";"Valuta";"Bedrag bij / af";"Verwerkingsdatum";"Valutadatum";"Code";"Type";"Volgnummer";"Betalingskenmerk";"Omschrijving";"Afschriftnummer"
"15-01-2024";"NL91ASNB0123456789";"NL01TEST9876543210";"Albert Heijn";"Hoofdstraat 1";"1234 AB";"Amsterdam";"EUR";"2.500,00";"EUR";"-25,50";"15-01-2024";"15-01-2024";"1234";"bea";"0001";"123456789";"Boodschappen";"001"`;

      const result = parseGenericCSV(csv);
      const row = result.rows[0];

      expect(row['Datum']).toBe('15-01-2024');
      expect(row['Je rekening']).toBe('NL91ASNB0123456789');
      expect(row['Van / naar']).toBe('NL01TEST9876543210');
      expect(row['Naam']).toBe('Albert Heijn');
      expect(row['Saldo voor boeking']).toBe('2.500,00');
      expect(row['Bedrag bij / af']).toBe('-25,50');
      expect(row['Type']).toBe('bea');
      expect(row['Betalingskenmerk']).toBe('123456789');
      expect(row['Omschrijving']).toBe('Boodschappen');
    });

    it('handles positive income transaction', () => {
      const csv = `"Datum";"Je rekening";"Van / naar";"Naam";"Saldo voor boeking";"Bedrag bij / af";"Type";"Omschrijving"
"10-01-2024";"NL91ASNB0123456789";"NL01TEST9876543210";"Werkgever BV";"5.000,00";"2.500,00";"ovs";"Salaris januari"`;

      const result = parseGenericCSV(csv);
      const row = result.rows[0];

      // Verify amount is positive (income)
      const amount = parseASNAmount(row['Bedrag bij / af']);
      expect(amount).toBe(2500);
      expect(amount).toBeGreaterThan(0);
    });

    it('handles negative expense transaction', () => {
      const csv = `"Datum";"Je rekening";"Van / naar";"Naam";"Saldo voor boeking";"Bedrag bij / af";"Type";"Omschrijving"
"10-01-2024";"NL91ASNB0123456789";"NL01TEST9876543210";"Huur BV";"5.000,00";"-1.200,00";"iom";"Huur januari"`;

      const result = parseGenericCSV(csv);
      const row = result.rows[0];

      // Verify amount is negative (expense)
      const amount = parseASNAmount(row['Bedrag bij / af']);
      expect(amount).toBe(-1200);
      expect(amount).toBeLessThan(0);
    });
  });
});
