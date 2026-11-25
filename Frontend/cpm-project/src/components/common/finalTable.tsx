import { Ref } from 'react';
import { PartyLabel } from './DynamicTable/DynamicTableContent';
import { Currency, TransportDraft, TransportResult, formatMoney, formatQuantity } from './DynamicTable/transport';

type FinalTableProps = {
  draft: TransportDraft;
  result: TransportResult;
  currency: Currency;
  headingRef: Ref<HTMLHeadingElement>;
};

export default function FinalTable({ draft, result, currency, headingRef }: FinalTableProps) {
  const totals = [
    ['Profit', result.totalProfit],
    ['Total cost', result.totalCost],
    ['Revenue', result.totalRevenue],
  ] as const;

  return (
    <section className="panel transport-result" aria-labelledby="transport-result-title">
      <div className="panel-header">
        <h2 className="panel-title" id="transport-result-title" ref={headingRef} tabIndex={-1}>Transport results</h2>
      </div>
      <dl className="transport-totals">
        {totals.map(([label, amount]) => (
          <div key={label}>
            <dt className="muted">{label}</dt>
            <dd>{formatMoney(amount, currency)}</dd>
          </div>
        ))}
      </dl>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Quantity and profit by route">
        <table className="data-table transport-table">
          <thead>
            <tr>
              <th scope="col">Routes</th>
              {draft.recipients.map((recipient) => (
                <th key={recipient.id} scope="col"><PartyLabel party={recipient} kind="recipient" currency={currency} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draft.suppliers.map((supplier, row) => (
              <tr key={supplier.id}>
                <th scope="row"><PartyLabel party={supplier} kind="supplier" currency={currency} /></th>
                {draft.recipients.map(({ id }, column) => (
                  <td key={id}>
                    <strong className="transport-route-quantity">{formatQuantity(result.transportationTable[row][column])}</strong>
                    <span className="visually-hidden"> units, profit </span>
                    <span className="transport-route-profit muted">{formatMoney(result.profitTable[row][column], currency)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-footer muted">Quantity and profit by route</div>
    </section>
  );
}
