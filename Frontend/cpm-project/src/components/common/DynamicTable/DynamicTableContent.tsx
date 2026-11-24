import Icon from '../Icon';
import { Currency, PartyKind, TransportDraft, TransportParty, formatMoney, formatQuantity, partyLabels } from './transport';

type PartyRemoval = (kind: PartyKind, id: number) => void;

type PartyLabelProps = {
  party: TransportParty;
  kind: PartyKind;
  currency: Currency;
  disabled?: boolean;
  onRemove?: PartyRemoval;
};

export function PartyLabel({ party, kind, currency, onRemove, disabled }: PartyLabelProps) {
  const labels = partyLabels[kind];

  return (
    <div className="transport-party">
      <div>
        <span className="transport-party-name">{labels.name} {party.id}</span>
        <span className="transport-party-meta muted">
          {labels.quantity} {formatQuantity(party.quantity)} <span aria-hidden="true">·</span> {formatMoney(party.price, currency)}
        </span>
      </div>
      {onRemove && (
        <button
          type="button"
          className="button button-icon transport-remove"
          aria-label={`Remove ${kind} ${party.id}`}
          onClick={() => onRemove(kind, party.id)}
          disabled={disabled}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}

type MatrixProps = {
  draft: TransportDraft;
  currency: Currency;
  onRemove: PartyRemoval;
};

export function PartialMatrix({ draft, currency, onRemove }: MatrixProps) {
  const hasSuppliers = draft.suppliers.length > 0;
  const parties = hasSuppliers ? draft.suppliers : draft.recipients;
  const kind = hasSuppliers ? 'supplier' : 'recipient';

  return (
    <ul className="transport-partial-list">
      {parties.map((party) => (
        <li key={party.id}>
          <PartyLabel party={party} kind={kind} currency={currency} onRemove={onRemove} />
        </li>
      ))}
    </ul>
  );
}

type EditableMatrixProps = MatrixProps & {
  disabled: boolean;
  onRouteChange: (supplierId: number, recipientId: number, value: string) => void;
};

export default function DynamicTableContent({ draft, currency, onRemove, disabled, onRouteChange }: EditableMatrixProps) {
  const { suppliers, recipients } = draft;

  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Transport cost matrix">
      <table className="data-table transport-table">
        <thead>
          <tr>
            <th scope="col">Routes</th>
            {recipients.map((recipient) => (
              <th scope="col" key={recipient.id}>
                <PartyLabel party={recipient} kind="recipient" currency={currency} onRemove={onRemove} disabled={disabled} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <th scope="row">
                <PartyLabel party={supplier} kind="supplier" currency={currency} onRemove={onRemove} disabled={disabled} />
              </th>
              {recipients.map(({ id }) => (
                <td key={id}>
                  <input
                    className="transport-cost"
                    type="number"
                    aria-label={`Route cost from supplier ${supplier.id} to recipient ${id}`}
                    placeholder="—"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    disabled={disabled}
                    value={supplier.routeCosts[id] ?? ''}
                    onChange={(event) => onRouteChange(supplier.id, id, event.currentTarget.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
