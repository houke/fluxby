export interface Account {
  id: string;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  orderIndex?: number;
  createdAt: string;
}

export interface AccountCreate {
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank?: string;
}

// Address Book types
export interface AddressBookEntry {
  id: string;
  iban: string;
  name: string;
  description: string | null;
  notes: string | null;
  originalName?: string | null;
  originalNames?: string[]; // Legacy/Migration support
  ibans?: string[]; // Support for multiple IBANs per contact
  createdAt: string;
}

export interface SharedIban {
  iban: string;
  merchantCount: number;
  merchants: Array<{ name: string; transactionCount: number }>;
  inAddressBook: boolean;
  addressBookId: string | null;
  isMarkedShared: boolean;
  isPartiallyResolved: boolean;
  providerName: string | null;
  isKnownProvider: boolean;
  knownProviderName: string | null;
}

export interface SharedIbanGroup {
  id: string;
  entries: Array<{ name: string; transactionCount: number }>;
  editedName: string;
  isSplit: boolean;
}
