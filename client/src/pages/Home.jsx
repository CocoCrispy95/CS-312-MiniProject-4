import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import BlogPostForm from '../components/BlogPostForm.jsx';
import PostList from '../components/PostList.jsx';

export default function Home({ currentUser, onSessionExpired }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Reload whenever the signed-in user changes so each post's `canEdit` is current.
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api.getBlogs()
      .then((data) => {
        console.log('Blogs from the backend:', data.blogs);
        if (!ignore) {
          setPosts(data.blogs);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.userId]);

  function handleApiError(err) {
    if (err.status === 401) {
      onSessionExpired();
    }
  }

  const handleCreated = (blog) => setPosts((current) => [blog, ...current]);
  const handleUpdated = (blog) =>
    setPosts((current) => current.map((post) => (post.id === blog.id ? blog : post)));
  const handleDeleted = (id) => setPosts((current) => current.filter((post) => post.id !== id));

  return (
    <main>
      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow">Issue no. 01 · Open to everyone</p>
          <h1 id="page-title">Write something<br /><em>worth keeping.</em></h1>
          <p className="intro-text">
            A simple corner of the internet for observations, ideas, and stories that deserve a little more room.
          </p>
        </div>
        <div className="intro-mark" aria-hidden="true"><span>✳</span></div>
      </section>

      <div className="content-grid">
        <section className="composer-panel" aria-labelledby="composer-title">
          {currentUser ? (
            <BlogPostForm currentUser={currentUser} onCreated={handleCreated} onApiError={handleApiError} />
          ) : (
            <>
              <div className="section-heading">
                <p className="eyebrow">Have something to share?</p>
                <h2 id="composer-title">Join the conversation.</h2>
              </div>
              <p className="auth-prompt">Sign in to write a post, or create an account to get started.</p>
              <Link className="button button-primary" to="/signin">
                Sign in to write <span aria-hidden="true">↗</span>
              </Link>
              <p className="form-footnote"><Link to="/signup">Create a free account</Link></p>
            </>
          )}
        </section>

        <section className="feed" aria-labelledby="feed-title">
          <div className="feed-heading">
            <div>
              <p className="eyebrow">The latest entries</p>
              <h2 id="feed-title">From the community</h2>
            </div>
            <span className="post-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
          </div>

          {loadError && <p className="alert feed-alert" role="alert">{loadError}</p>}
          {loading && posts.length === 0 && <p className="feed-loading">Loading posts…</p>}

          {!loading && !loadError && posts.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✎</span>
              <h3>The page is quiet.</h3>
              <p>Be the first person to leave a note.</p>
            </div>
          )}

          <PostList
            posts={posts}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onApiError={handleApiError}
          />
        </section>
      </div>
    </main>
  );
}
