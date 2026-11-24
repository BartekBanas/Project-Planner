import axios from 'axios';
import { FormEvent, useEffect, useRef, useState } from 'react';
import FinalTable from '../finalTable';
import Icon from '../Icon';
import DynamicTableContent, { PartialMatrix } from './DynamicTableContent';
import { Currency, PartyKind, TransportDraft, TransportParty, TransportResult, partyLabels } from './transport';
import './DynamicTable.css';

const currencies: Currency[] = ['PLN', 'USD', 'EUR', 'GBP'];
const transportUrl = 'https://localhost:44363/api/TP';
const maxQuantity = 2147483647;

function getValidationMessage(payload: unknown): string | undefined {
  if (!Array.isArray(payload)) return undefined;

  return payload.find((issue: unknown): issue is { errorMessage: string } => (
    typeof issue === 'object'
    && issue !== null
    && 'errorMessage' in issue
    && typeof issue.errorMessage === 'string'
  ))?.errorMessage;
}

type PartyEditorProps = {
  disabled: boolean;
  onAdd: (kind: PartyKind, quantity: number, price: number) => void;
};

function PartyEditor({ disabled, onAdd }: PartyEditorProps) {
  const [kind, setKind] = useState<PartyKind>('supplier');
  const [priceError, setPriceError] = useState(false);
  const quantityInput = useRef<HTMLInputElement>(null);
  const priceInput = useRef<HTMLInputElement>(null);
  const labels = partyLabels[kind];

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantityField = quantityInput.current;
    const priceField = priceInput.current;
    if (!quantityField || !priceField) return;

    const quantity = quantityField.valueAsNumber;
    const price = priceField.valueAsNumber;
    if (price <= 0) {
      setPriceError(true);
      priceField.focus();
      return;
    }

    onAdd(kind, quantity, price);
    quantityField.value = '';
    priceField.value = '';
    quantityField.focus();
  }

  return (
    <form className="panel transport-entry" onSubmit={handleAdd} aria-labelledby="transport-entry-title">
      <div className="panel-header">
        <h2 className="panel-title" id="transport-entry-title">Dodaj uczestnika</h2>
      </div>
      <fieldset className="panel-body transport-entry-fields" disabled={disabled}>
        <legend className="visually-hidden">Dane uczestnika</legend>
        <fieldset className="transport-segmented">
          <legend className="visually-hidden">Typ uczestnika</legend>
          <label>
            <input type="radio" name="party-kind" value="supplier" checked={kind === 'supplier'} onChange={() => setKind('supplier')} />
            <span>Dostawca</span>
          </label>
          <label>
            <input type="radio" name="party-kind" value="recipient" checked={kind === 'recipient'} onChange={() => setKind('recipient')} />
            <span>Odbiorca</span>
          </label>
        </fieldset>
        <div className="form-grid transport-quantity-price">
          <label className="field">
            <span>{labels.quantity}</span>
            <input ref={quantityInput} type="number" placeholder="0" min="1" max={maxQuantity} step="1" inputMode="numeric" required />
          </label>
          <label className="field">
            <span>{labels.price}</span>
            <input
              ref={priceInput}
              type="number"
              placeholder="0,00"
              min="0"
              step="any"
              inputMode="decimal"
              required
              aria-invalid={priceError || undefined}
              aria-describedby={priceError ? 'transport-price-error' : undefined}
              onChange={() => setPriceError(false)}
            />
          </label>
        </div>
        {priceError && <p className="inline-error" id="transport-price-error" role="alert">Podaj cenę większą od zera.</p>}
        <button className="button transport-add" type="submit">
          <Icon name="plus" /> {kind === 'supplier' ? 'Dodaj dostawcę' : 'Dodaj odbiorcę'}
        </button>
      </fieldset>
    </form>
  );
}

export default function DynamicTable() {
  const [draft, setDraft] = useState<TransportDraft>({ suppliers: [], recipients: [] });
  const [currency, setCurrency] = useState<Currency>('PLN');
  const [result, setResult] = useState<TransportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const nextId = useRef({ supplier: 1, recipient: 1 });
  const pendingRequest = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement | null>(null);
  const { suppliers, recipients } = draft;
  const hasRoutes = suppliers.length > 0 && recipients.length > 0;
  const isEmpty = suppliers.length === 0 && recipients.length === 0;
  const missingParty = suppliers.length === 0 ? 'dostawcę' : 'odbiorcę';

  useEffect(() => () => pendingRequest.current?.abort(), []);
  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);

  function updateDraft(update: (current: TransportDraft) => TransportDraft) {
    setDraft(update);
    setResult(null);
    setError(null);
  }

  function addParty(kind: PartyKind, quantity: number, price: number) {
    const party: TransportParty = { id: nextId.current[kind]++, quantity, price };
    updateDraft((current) => kind === 'supplier'
      ? { ...current, suppliers: [...current.suppliers, { ...party, routeCosts: {} }] }
      : { ...current, recipients: [...current.recipients, party] });
  }

  function removeParty(kind: PartyKind, id: number) {
    updateDraft((current) => {
      if (kind === 'supplier') {
        return { ...current, suppliers: current.suppliers.filter((supplier) => supplier.id !== id) };
      }

      return {
        recipients: current.recipients.filter((recipient) => recipient.id !== id),
        suppliers: current.suppliers.map((supplier) => {
          const routeCosts = { ...supplier.routeCosts };
          delete routeCosts[id];
          return { ...supplier, routeCosts };
        }),
      };
    });
  }

  function updateRoute(supplierId: number, recipientId: number, value: string) {
    updateDraft((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier) => supplier.id === supplierId
        ? { ...supplier, routeCosts: { ...supplier.routeCosts, [recipientId]: value } }
        : supplier),
    }));
  }

  async function solve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRoutes || pendingRequest.current) return;

    const controller = new AbortController();
    pendingRequest.current = controller;
    setSolving(true);
    setError(null);

    try {
      const { data } = await axios.post<TransportResult>(transportUrl, {
        Suppliers: suppliers.map(({ quantity, price }) => ({ Supply: quantity, Cost: price })),
        Recipients: recipients.map(({ quantity, price }) => ({ Demand: quantity, Cost: price })),
        TransportCost: suppliers.map(({ routeCosts }) => recipients.map(({ id }) => Number(routeCosts[id]))),
      }, { signal: controller.signal });
      if (!controller.signal.aborted) setResult(data);
    } catch (requestError) {
      if (controller.signal.aborted) return;

      const reply = axios.isAxiosError<unknown>(requestError) ? requestError.response : undefined;
      setError(reply?.status === 400
        ? getValidationMessage(reply.data) ?? 'Sprawdź podaż, popyt i koszty wszystkich tras.'
        : 'Nie udało się obliczyć planu. Sprawdź połączenie z serwerem i spróbuj ponownie.');
    } finally {
      pendingRequest.current = null;
      if (!controller.signal.aborted) setSolving(false);
    }
  }

  return (
    <div className="workspace-grid">
      <div className="transport-main">
        <form className="panel transport-matrix" aria-labelledby="transport-matrix-title" onSubmit={solve}>
          <div className="panel-header transport-panel-heading">
            <h2 className="panel-title" id="transport-matrix-title">Koszty transportu</h2>
            <div className="transport-counts muted" aria-live="polite">
              <span>Dostawcy <strong>{suppliers.length}</strong></span>
              <span>Odbiorcy <strong>{recipients.length}</strong></span>
            </div>
          </div>
          {hasRoutes ? (
            <DynamicTableContent
              draft={draft}
              currency={currency}
              disabled={solving}
              onRemove={removeParty}
              onRouteChange={updateRoute}
            />
          ) : (
            <>
              <div className="empty-state transport-empty">
                <span className="transport-empty-icon" aria-hidden="true"><Icon name="table" size={18} /></span>
                <h3>{isEmpty ? 'Brak tras transportu' : `Dodaj ${missingParty}`}</h3>
                <p className="muted">{isEmpty
                  ? 'Dodaj dostawcę i odbiorcę, aby wprowadzić koszty tras.'
                  : 'Macierz kosztów pojawi się po uzupełnieniu obu stron.'}</p>
              </div>
              {!isEmpty && <PartialMatrix draft={draft} currency={currency} onRemove={removeParty} />}
            </>
          )}
          <div className="panel-footer transport-matrix-footer">
            <p className="muted">{hasRoutes ? 'Wpisz jednostkowy koszt każdej trasy' : 'Wymagany dostawca i odbiorca'}</p>
            <button className="button button-primary" type="submit" disabled={!hasRoutes || solving}>
              {solving ? 'Obliczanie…' : 'Oblicz plan'}
            </button>
          </div>
          {error && <p className="inline-error transport-solve-error" role="alert">{error}</p>}
        </form>
        {result && <FinalTable draft={draft} result={result} currency={currency} headingRef={resultHeading} />}
      </div>
      <aside className="transport-editor" aria-label="Ustawienia transportu">
        <PartyEditor onAdd={addParty} disabled={solving} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title" id="transport-currency-title">Waluta</h2>
          </div>
          <div className="panel-body">
            <fieldset className="transport-segmented" aria-labelledby="transport-currency-title">
              {currencies.map((option) => (
                <label key={option}>
                  <input type="radio" name="transport-currency" value={option} checked={currency === option} onChange={() => setCurrency(option)} />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </section>
      </aside>
    </div>
  );
}
