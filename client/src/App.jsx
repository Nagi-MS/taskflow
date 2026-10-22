import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Protected({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <p className="center muted" role="status">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">TaskFlow</Link>
        {user && (
          <div className="nav-right">
            <span className="muted hide-sm">Hi, {user.name}</span>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        )}
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
          <Route path="*" element={<p className="center">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
