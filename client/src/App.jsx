import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  // undefined = still checking the session, null = signed out
  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSession()
      .then((data) => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null));
  }, []);

  async function handleSignOut() {
    try {
      await api.logout();
    } finally {
      setCurrentUser(null);
      navigate('/');
    }
  }

  if (currentUser === undefined) {
    return <p className="loading">Loading…</p>;
  }

  return (
    <>
      <Header currentUser={currentUser} onSignOut={handleSignOut} />
      <Routes>
        <Route
          path="/"
          element={<Home currentUser={currentUser} onSessionExpired={() => setCurrentUser(null)} />}
        />
        <Route path="/signin" element={<SignIn onSignedIn={setCurrentUser} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
