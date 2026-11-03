import { useState } from 'react';
import { api } from '../api.js';

// Controlled form for writing a new post. Each field lives in state and is
// bound to its input with `value`; onChange keeps state in sync as the user types.
export default function BlogPostForm({ currentUser, onCreated, onApiError }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const post = { title: title.trim(), content: content.trim() };
    if (!post.title || !post.content) {
      setError('Please add a title and some words before publishing.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const data = await api.createBlog(post);
      onCreated(data.blog);
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err.message);
      onApiError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="section-heading">
        <p className="eyebrow">Start a new entry</p>
        <h2 id="composer-title">What’s on your mind?</h2>
      </div>
      {error && <p className="alert" role="alert">{error}</p>}
      <form className="post-form" onSubmit={handleSubmit}>
        <label htmlFor="title">Post title</label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Give it a good headline"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
        />

        <label htmlFor="content">Your post</label>
        <textarea
          id="content"
          name="content"
          rows={7}
          placeholder="Start writing here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={4000}
        />

        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish post'} <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p className="form-footnote">
        Publishing as {currentUser.name}. Your entries are saved to the blog database.
      </p>
    </>
  );
}
