import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function SignIn({ onSignedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const notice = location.state?.notice;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.signIn({ user_id: userId, password });
      onSignedIn(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setPassword('');
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="eyebrow">Welcome back</p>
        <h1>Your space<br />is <em>waiting.</em></h1>
        <p>Sign in to keep writing and catch up with the latest entries.</p>
      </section>
      <section className="composer-panel auth-panel" aria-labelledby="signin-title">
        <h2 id="signin-title">Sign in</h2>
        {error && <p className="alert" role="alert">{error}</p>}
        {!error && notice && <p className="alert alert-success" role="status">{notice}</p>}
        <form className="post-form" onSubmit={handleSubmit}>
          <label htmlFor="user-id">User ID</label>
          <input
            id="user-id"
            type="text"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            maxLength={255}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={128}
          />

          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="auth-prompt">New to the blog? <Link to="/signup">Create an account</Link>.</p>
      </section>
    </main>
  );
}
