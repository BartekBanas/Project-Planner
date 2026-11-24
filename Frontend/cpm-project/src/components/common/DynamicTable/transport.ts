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
  supplier: { name: 'Dostawca', quantity: 'Podaż', price: 'Cena zakupu' },
  recipient: { name: 'Odbiorca', quantity: 'Popyt', price: 'Cena sprzedaży' },
};

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currencyDisplay: 'narrowSymbol',
    currency,
  }).format(amount);
}

const quantityFormatter = new Intl.NumberFormat('pl-PL');

export function formatQuantity(quantity: number) {
  return quantityFormatter.format(quantity);
}
