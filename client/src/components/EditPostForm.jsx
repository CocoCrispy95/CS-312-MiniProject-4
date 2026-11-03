import { useState } from 'react';
import { api } from '../api.js';

// Edit form that receives the existing post as a prop and pre-fills its fields.
export default function EditPostForm({ post, onSaved, onCancel, onApiError }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fieldId = `post-${post.id}`;

  async function handleSubmit(event) {
    event.preventDefault();
    const changes = { title: title.trim(), content: content.trim() };
    if (!changes.title || !changes.content) {
      setError('A post needs both a title and some words.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const data = await api.updateBlog(post.id, changes);
      onSaved(data.blog);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      onApiError(err);
    }
  }

  return (
    <div className="composer-panel edit-panel">
      <p className="eyebrow">Make it sing</p>
      <h3 className="edit-heading">Update post</h3>
      {error && <p className="alert" role="alert">{error}</p>}
      <form className="post-form" onSubmit={handleSubmit}>
        <label htmlFor={`${fieldId}-title`}>Post title</label>
        <input
          id={`${fieldId}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
          autoFocus
        />

        <label htmlFor={`${fieldId}-content`}>Your post</label>
        <textarea
          id={`${fieldId}-content`}
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={4000}
        />

        <div className="form-actions">
          <button className="button button-quiet" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save changes'} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
