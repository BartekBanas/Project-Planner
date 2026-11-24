import { useState } from 'react';
import './Workspace.css';
import './App.css';
import TransportWorkspace from './components/common/DynamicTable/DynamicTable';
import CpmWorkspace from './components/common/table';

const methods = {
  transport: {
    label: 'Metoda pośrednika',
    title: 'Plan transportu',
    description: 'Oblicz opłacalny plan dostaw na podstawie podaży, popytu i kosztów przewozu.',
  },
  cpm: {
    label: 'Metoda CPM',
    title: 'Ścieżka krytyczna',
    description: 'Wyznacz czas realizacji projektu i znajdź zadania, które decydują o jego terminie.',
  },
} as const;

type Method = keyof typeof methods;

const methodOptions: Method[] = ['transport', 'cpm'];

export default function App() {
  const [method, setMethod] = useState<Method>('transport');
  const active = methods[method];

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-width app-bar-inner">
          <div className="app-brand">
            <img src={`${process.env.PUBLIC_URL}/planner.png`} alt="" width="36" height="36" />
            <span>Project Planner</span>
          </div>

          <fieldset className="method-picker">
            <legend className="visually-hidden">Metoda obliczeń</legend>
            {methodOptions.map((option) => (
              <label className="method-option" key={option}>
                <input
                  className="visually-hidden"
                  type="radio"
                  name="planner-method"
                  value={option}
                  checked={method === option}
                  onChange={() => setMethod(option)}
                />
                <span>{methods[option].label}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </header>

      <main className="app-width app-main" aria-labelledby="workspace-title">
        <div className="workspace-heading">
          <h1 id="workspace-title">{active.title}</h1>
          <p>{active.description}</p>
        </div>

        <div hidden={method !== 'transport'}>
          <TransportWorkspace />
        </div>
        <div hidden={method !== 'cpm'}>
          <CpmWorkspace />
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-width app-footer-inner">
          <details className="app-credits">
            <summary>Autorzy</summary>
            <ul>
              <li>Bartłomiej Burda</li>
              <li>Bartłomiej Banaś</li>
              <li>Dawid Chmielowiec</li>
              <li>Damian Błażowski</li>
            </ul>
          </details>
        </div>
      </footer>
    </div>
  );
}
