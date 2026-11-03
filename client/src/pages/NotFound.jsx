import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 · Page not found</p>
      <h1>That page has<br /><em>gone quiet.</em></h1>
      <Link className="button button-primary" to="/">Return home <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
