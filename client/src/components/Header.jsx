import { Link, useLocation } from 'react-router-dom';

export default function Header({ currentUser, onSignOut }) {
  const { pathname } = useLocation();

  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="The Blog Space home">
        the blog <span>space</span>
      </Link>
      <div className="header-actions">
        {pathname === '/' && <p className="header-note">A place for thoughtful posts.</p>}
        {currentUser ? (
          <>
            <span className="header-user">Hi, {currentUser.name}</span>
            <button className="text-button" type="button" onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <>
            {pathname !== '/signin' && <Link className="text-button" to="/signin">Sign in</Link>}
            {pathname !== '/signup' && <Link className="text-button" to="/signup">Create account</Link>}
          </>
        )}
      </div>
    </header>
  );
}
