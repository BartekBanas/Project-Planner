export type Currency = 'PLN' | 'USD' | 'EUR' | 'GBP';

export type TransportParty = {
  id: number;
  quantity: number;
  price: number;
};

export type Supplier = TransportParty & {
  routeCosts: Partial<Record<number, string>>;
};

export type TransportDraft = {
  suppliers: Supplier[];
  recipients: TransportParty[];
};

export type TransportResult = {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  transportationTable: number[][];
  profitTable: number[][];
};

export type PartyKind = 'supplier' | 'recipient';

export const partyLabels = {
  supplier: { name: 'Supplier', quantity: 'Supply', price: 'Purchase price' },
  recipient: { name: 'Recipient', quantity: 'Demand', price: 'Selling price' },
};

const englishLocale = 'en-US';

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat(englishLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

const quantityFormatter = new Intl.NumberFormat(englishLocale);

export function formatQuantity(quantity: number) {
  return quantityFormatter.format(quantity);
}
