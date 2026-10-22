import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isReg = mode === 'register';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    // Client-side validation improves UX; the server validates again.
    if (isReg && form.name.trim().length < 2) return setError('Name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      await (isReg ? register(form) : login({ email: form.email, password: form.password }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <h1>{isReg ? 'Create your account' : 'Welcome back'}</h1>
      {error && <p className="alert" role="alert">{error}</p>}
      {isReg && (
        <label>Name
          <input value={form.name} onChange={set('name')} autoComplete="name" />
        </label>
      )}
      <label>Email
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
      </label>
      <label>Password
        <input type="password" value={form.password} onChange={set('password')}
          autoComplete={isReg ? 'new-password' : 'current-password'} />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Sign up' : 'Log in'}</button>
      <p className="muted">
        {isReg ? 'Already registered? ' : 'New here? '}
        <Link to={isReg ? '/login' : '/register'}>{isReg ? 'Log in' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
