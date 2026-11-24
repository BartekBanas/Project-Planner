import axios from 'axios';
import { FormEvent, Ref, useEffect, useRef, useState } from 'react';
import CpmGraph from './CpmGraph';
import Icon from './Icon';
import { CpmRequestActivity, CpmSolution } from './cpmTypes';
import './cpm.css';

type ActivityRow = CpmRequestActivity & { id: number };
type ActivityDraft = { name: string; duration: string; start: string; finish: string };
type Calculation =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; messages: string[] }
  | { status: 'complete'; solution: CpmSolution };

const emptyDraft: ActivityDraft = { name: '', duration: '', start: '', finish: '' };
const integerLimit = 2_147_483_647;

function calculationErrors(error: unknown): string[] {
  if (!axios.isAxiosError<({ errorMessage?: string } | null)[]>(error)) {
    return ['Try calculating the critical path again.'];
  }

  if (!error.response) {
    return ['Could not connect to the calculation server. Check that it is running and try again.'];
  }

  const validation = error.response.data;
  const messages = Array.isArray(validation) ? validation.flatMap((item) => (
    typeof item?.errorMessage === 'string' && item.errorMessage.trim() ? [item.errorMessage] : []
  )) : [];

  return messages.length ? messages : ['The server could not calculate the critical path. Check your inputs and try again.'];
}

export default function CpmWorkspace() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draftError, setDraftError] = useState('');
  const [calculation, setCalculation] = useState<Calculation>({ status: 'idle' });
  const nextId = useRef(0);
  const request = useRef<AbortController | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const loading = calculation.status === 'loading';

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (calculation.status === 'complete' && resultHeading.current?.getClientRects().length) {
      resultHeading.current.focus();
    }
  }, [calculation]);

  function resetEditor() {
    setDraft(emptyDraft);
    setEditingId(null);
    setDraftError('');
  }

  function changeDraft(field: keyof ActivityDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setDraftError('');
  }

  function editActivity(activity: ActivityRow) {
    setDeletingId(null);
    setEditingId(activity.id);
    setDraft({
      name: activity.taskName,
      duration: String(activity.duration),
      start: String(activity.sequence[0]),
      finish: String(activity.sequence[1]),
    });
    setDraftError('');
    nameInput.current?.focus();
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { name, duration, start, finish } = draft;
    const taskName = name.trim();
    if (!taskName) {
      setDraftError('Enter an activity name.');
      nameInput.current?.focus();
      return;
    }
    if (Number(start) === Number(finish)) {
      setDraftError('Choose different start and finish events.');
      return;
    }

    const id = editingId ?? nextId.current++;
    const activity: ActivityRow = { id, taskName, duration: Number(duration), sequence: [Number(start), Number(finish)] };
    setActivities((current) => editingId === null
      ? [...current, activity]
      : current.map((row) => row.id === id ? activity : row));
    invalidateCalculation();
    resetEditor();
    nameInput.current?.focus();
  }

  function deleteActivity(id: number) {
    setActivities((current) => current.filter((activity) => activity.id !== id));
    setDeletingId(null);
    invalidateCalculation();
    if (editingId === id) {
      resetEditor();
    }
    nameInput.current?.focus();
  }

  function invalidateCalculation() {
    request.current?.abort();
    request.current = null;
    setCalculation({ status: 'idle' });
  }

  async function calculate() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setCalculation({ status: 'loading' });
    try {
      const { data } = await axios.post<CpmSolution>(
        'https://localhost:44363/api/CPM',
        { activities: activities.map(({ taskName, duration, sequence }) => ({ taskName, duration, sequence })) },
        { signal: controller.signal },
      );
      if (!controller.signal.aborted) {
        setCalculation({ status: 'complete', solution: data });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setCalculation({ status: 'error', messages: calculationErrors(error) });
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
      }
    }
  }

  return (
    <div className="cpm-workspace">
      <div className="workspace-grid">
        <section className="panel" aria-labelledby="cpm-activities">
          <header className="panel-header">
            <h2 className="panel-title" id="cpm-activities">Activities</h2>
            <span className="cpm-count" aria-label={`Activity count: ${activities.length}`}>{activities.length}</span>
          </header>
          {activities.length ? (
            <div className="table-scroll" role="region" aria-label="Activity table" tabIndex={0}>
              <table className="data-table cpm-activity-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Events</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className={editingId === activity.id ? 'cpm-editing-row' : undefined}>
                      <th scope="row">{activity.taskName}</th>
                      <td className="cpm-number">{activity.duration}</td>
                      <td className="cpm-number">
                        <span className="cpm-sequence">
                          <span>{activity.sequence[0]}</span>
                          <Icon name="arrow-right" size={12} />
                          <span className="visually-hidden">to</span>
                          <span>{activity.sequence[1]}</span>
                        </span>
                      </td>
                      <td>
                        <div className="cpm-row-actions">
                          <button
                            className="button"
                            type="button"
                            onClick={deletingId === activity.id ? () => setDeletingId(null) : () => editActivity(activity)}
                            aria-label={deletingId === activity.id ? 'Cancel removal' : `Edit ${activity.taskName}`}
                          >
                            {deletingId === activity.id ? 'Cancel' : <><Icon name="edit" /> Edit</>}
                          </button>
                          <button
                            className={deletingId === activity.id ? 'button button-primary' : 'button'}
                            type="button"
                            onClick={deletingId === activity.id ? () => deleteActivity(activity.id) : () => setDeletingId(activity.id)}
                            aria-label={deletingId === activity.id ? `Confirm removal of ${activity.taskName}` : `Remove ${activity.taskName}`}
                          >
                            {deletingId === activity.id ? 'Confirm' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state cpm-empty">
              <div className="cpm-empty-icon"><Icon name="workflow" size={20} /></div>
              <h3>No activities yet</h3>
              <p className="muted">Add your activities with their durations and event numbers.</p>
            </div>
          )}
          <footer className="panel-footer cpm-calculate">
            <button className="button button-primary" type="button" disabled={!activities.length || loading} onClick={calculate}>
              <Icon name="bolt" /> {loading ? 'Calculating…' : 'Calculate critical path'}
            </button>
          </footer>
          {calculation.status === 'error' && (
            <div className="inline-error cpm-api-error" role="alert">
              <strong>Could not calculate the critical path</strong>
              <ul>{calculation.messages.map((message, index) => <li key={index}>{message}</li>)}</ul>
            </div>
          )}
        </section>

        <aside className="panel" aria-labelledby="cpm-editor">
          <header className="panel-header">
            <h2 className="panel-title" id="cpm-editor">{editingId === null ? 'New activity' : 'Edit activity'}</h2>
          </header>
          <form onSubmit={saveActivity}>
            <div className="panel-body form-grid">
              <label className="field">
                Name
                <input ref={nameInput} name="name" required value={draft.name} onChange={(event) => changeDraft('name', event.target.value)} />
              </label>
              <label className="field">
                Duration
                <input name="duration" required type="number" min={0} max={integerLimit} value={draft.duration} onChange={(event) => changeDraft('duration', event.target.value)} />
              </label>
              <fieldset className="cpm-events">
                <legend>Events</legend>
                <div className="cpm-event-fields">
                  <label className="field">
                    Start
                    <input name="start" required type="number" min={0} max={integerLimit} value={draft.start} onChange={(event) => changeDraft('start', event.target.value)} />
                  </label>
                  <Icon name="arrow-right" />
                  <label className="field">
                    Finish
                    <input name="finish" required type="number" min={0} max={integerLimit} value={draft.finish} onChange={(event) => changeDraft('finish', event.target.value)} />
                  </label>
                </div>
              </fieldset>
              {draftError && <p className="inline-error" role="alert">{draftError}</p>}
            </div>
            <footer className="panel-footer action-row">
              <button className="button button-primary" type="submit">
                {editingId === null && <Icon name="plus" />} {editingId === null ? 'Add activity' : 'Save changes'}
              </button>
              <button className="button" type="button" onClick={resetEditor}>{editingId === null ? 'Clear' : 'Cancel'}</button>
            </footer>
          </form>
        </aside>
      </div>

      {calculation.status === 'complete' && <CpmResults solution={calculation.solution} heading={resultHeading} />}
    </div>
  );
}

function CpmResults({ solution, heading }: { solution: CpmSolution; heading: Ref<HTMLHeadingElement> }) {
  const criticalCount = solution.activities.filter((activity) => activity.critical).length;
  const projectDuration = solution.events.reduce((latest, event) => Math.max(latest, event.earliestTime), 0);
  return (
    <section className="panel cpm-results" aria-labelledby="cpm-result">
      <header className="panel-header">
        <h2 ref={heading} tabIndex={-1} className="panel-title" id="cpm-result">Critical path results</h2>
      </header>
      <dl className="cpm-result-metrics">
        <div><dt>Project duration</dt><dd>{projectDuration}</dd></div>
        <div><dt>Critical activities</dt><dd>{criticalCount}</dd></div>
        <div><dt>Events</dt><dd>{solution.events.length}</dd></div>
      </dl>
      <CpmGraph solution={solution} />
      <div className="table-scroll" role="region" aria-label="Activity schedule" tabIndex={0}>
        <table className="data-table cpm-result-table">
          <thead>
            <tr>
              <th scope="col">Activity</th>
              <th scope="col">Events</th>
              <th scope="col">Duration</th>
              <th scope="col">Early schedule</th>
              <th scope="col">Late schedule</th>
              <th scope="col">Float</th>
            </tr>
          </thead>
          <tbody>
            {solution.activities.map((activity) => (
              <tr key={activity.id}>
                <th scope="row">
                  {activity.taskName}
                  {activity.critical && <span className="cpm-critical-label">Critical</span>}
                </th>
                <td className="cpm-number">{activity.sequence[0]} → {activity.sequence[1]}</td>
                <td className="cpm-number">{activity.duration}</td>
                <td className="cpm-number">{activity.earlyStart} → {activity.earlyFinish}</td>
                <td className="cpm-number">{activity.lateStart} → {activity.lateFinish}</td>
                <td className="cpm-number">{activity.timeReserve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
