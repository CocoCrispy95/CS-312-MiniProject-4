import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ user_id: '', name: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.signUp(form);
      navigate('/signin', { state: { notice: data.message } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="eyebrow">A space of your own</p>
        <h1>Make room for<br /><em>your words.</em></h1>
        <p>Create an account to share stories and ideas with the community.</p>
      </section>
      <section className="composer-panel auth-panel" aria-labelledby="signup-title">
        <h2 id="signup-title">Create your account</h2>
        {error && <p className="alert" role="alert">{error}</p>}
        <form className="post-form" onSubmit={handleSubmit}>
          <label htmlFor="user-id">User ID</label>
          <input
            id="user-id"
            name="user_id"
            type="text"
            autoComplete="username"
            value={form.user_id}
            onChange={handleChange}
            required
            maxLength={255}
          />

          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={255}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={128}
          />
          <p className="form-footnote">Use at least 8 characters. Passwords are stored securely as salted hashes.</p>

          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="auth-prompt">Already have an account? <Link to="/signin">Sign in</Link>.</p>
      </section>
    </main>
  );
}
