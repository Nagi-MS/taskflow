import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '');

function TaskForm({ onAdded }) {
  const [f, setF] = useState({ title: '', description: '', dueDate: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!f.title.trim()) return setError('Title is required.');
    setBusy(true); setError('');
    try {
      await api.createTask(f);
      setF({ title: '', description: '', dueDate: '' });
      onAdded();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Add a task</h2>
      {error && <p className="alert" role="alert">{error}</p>}
      <label>Title *
        <input value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </label>
      <label>Description
        <textarea rows={2} value={f.description} maxLength={500} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </label>
      <label>Due date
        <input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Add task'}</button>
    </form>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState('loading'); // loading | success | error
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const d = await api.listTasks({ page, status });
      // If the last item on a page was removed, step back one page.
      if (d.tasks.length === 0 && page > 1) return setPage(page - 1);
      setTasks(d.tasks); setMeta(d); setState('success');
    } catch (err) { setError(err.message); setState('error'); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    try { await api.updateTask(t._id, { status: t.status === 'done' ? 'todo' : 'done' }); load(); }
    catch (err) { setError(err.message); setState('error'); }
  };
  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try { await api.deleteTask(t._id); load(); }
    catch (err) { setError(err.message); setState('error'); }
  };
  const onFilter = (e) => { setStatus(e.target.value); setPage(1); };

  return (
    <div className="grid">
      <TaskForm onAdded={() => { setPage(1); load(); }} />
      <section aria-live="polite">
        <div className="row">
          <h2>Your tasks {state === 'success' && <span className="muted">({meta.total})</span>}</h2>
          <label className="inline">Show
            <select value={status} onChange={onFilter}>
              <option value="">All</option><option value="todo">To do</option><option value="done">Done</option>
            </select>
          </label>
        </div>

        {state === 'loading' && <p className="muted" role="status">Loading tasks…</p>}
        {state === 'error' && (
          <div className="alert" role="alert">{error} <button className="btn ghost" onClick={load}>Retry</button></div>
        )}
        {state === 'success' && tasks.length === 0 && (
          <p className="card muted">{status ? 'No tasks match this filter.' : 'No tasks yet. Add your first task to get started.'}</p>
        )}
        {state === 'success' && (
          <ul className="tasks">
            {tasks.map((t) => (
              <li key={t._id} className={`card task ${t.status}`}>
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" as ${t.status === 'done' ? 'to do' : 'done'}`} />
                <div className="grow">
                  <strong>{t.title}</strong>
                  {t.description && <p className="muted">{t.description}</p>}
                  {t.dueDate && <small className="muted">Due {fmt(t.dueDate)}</small>}
                </div>
                <button className="btn ghost danger" onClick={() => remove(t)}>Delete</button>
              </li>
            ))}
          </ul>
        )}

        {state === 'success' && meta.pages > 1 && (
          <div className="row pager">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="muted">Page {meta.page} of {meta.pages}</span>
            <button className="btn ghost" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
