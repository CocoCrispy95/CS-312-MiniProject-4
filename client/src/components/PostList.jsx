import { useState } from 'react';
import { api, formatDate } from '../api.js';
import EditPostForm from './EditPostForm.jsx';

// Renders every post. Edit and Delete appear only on posts the backend
// marked with `canEdit` (the signed-in user created them).
export default function PostList({ posts, onUpdated, onDeleted, onApiError }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="post-list">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          index={index}
          isEditing={editingId === post.id}
          onEdit={() => setEditingId(post.id)}
          onCancelEdit={() => setEditingId(null)}
          onSaved={(updated) => {
            setEditingId(null);
            onUpdated(updated);
          }}
          onDeleted={onDeleted}
          onApiError={onApiError}
        />
      ))}
    </div>
  );
}

function PostCard({ post, index, isEditing, onEdit, onCancelEdit, onSaved, onDeleted, onApiError }) {
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await api.deleteBlog(post.id);
      onDeleted(post.id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      onApiError(err);
    }
  }

  return (
    <article className="post-card" style={{ '--delay': `${Math.min(index, 8) * 80}ms` }}>
      <div className="post-meta">
        <span className="post-number">{String(index + 1).padStart(2, '0')}</span>
        <span>{post.author}</span>
        <span className="dot" aria-hidden="true" />
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </div>

      {isEditing ? (
        <EditPostForm post={post} onSaved={onSaved} onCancel={onCancelEdit} onApiError={onApiError} />
      ) : (
        <>
          <h3>{post.title}</h3>
          <p className="post-content">{post.content}</p>
          {error && <p className="alert" role="alert">{error}</p>}
          {post.canEdit && (
            <div className="post-actions">
              <button className="text-button" type="button" onClick={onEdit}>
                Edit <span aria-hidden="true">↗</span>
              </button>
              <button className="text-button danger" type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'} <span aria-hidden="true">×</span>
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
