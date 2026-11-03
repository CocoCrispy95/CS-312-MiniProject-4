# The Blog Space: React Edition

The Mini-Project-1 blog rebuilt with a **React** frontend. The **Node.js / Express** backend now returns JSON and keeps using **PostgreSQL**. Visitors can read the feed. Signed-in users can create posts and edit or delete only the posts they wrote.

```
Mini-Project4/
├── server/            Express JSON API (port 8000) + PostgreSQL
│   ├── server.js
│   └── schema.sql
└── client/            React app built with Vite (port 5173 in development)
    └── src/
        ├── api.js                     fetch() helpers for every backend route
        ├── App.jsx                    routes + signed-in user state
        ├── pages/Home.jsx             homepage: composer + feed, holds the posts list in state
        ├── pages/SignIn.jsx           sign-in form
        ├── pages/SignUp.jsx           sign-up form
        ├── pages/NotFound.jsx
        └── components/
            ├── BlogPostForm.jsx       controlled form for new posts
            ├── PostList.jsx           maps posts → cards with Edit / Delete
            ├── EditPostForm.jsx       edit form pre-filled from the post passed as props
            ├── Header.jsx
            └── Footer.jsx
```

## 1. Set up PostgreSQL

1. In pgAdmin, create a database named `blogdb`. If you already created it for the previous mini-project, you can reuse it.
2. Open the Query Tool on that database and run [`server/schema.sql`](./server/schema.sql). It is safe to run more than once.

Demo accounts:

| User ID | Password |
| --- | --- |
| `maya` | `MayaBlog2026!` |
| `jordan` | `JordanBlog2026!` |
| `alex` | `AlexBlog2026!` |

## 2. Install and run (development)

From the `Mini-Project4` folder in PowerShell:

```powershell
npm run install:all
$env:PGPASSWORD="your-postgres-password"
$env:SESSION_SECRET="replace-this-with-a-long-random-secret"
npm run dev
```

`npm run dev` starts both servers:

- API: http://localhost:8000/api (for example, http://localhost:8000/api/blogs)
- React app: **http://localhost:5173** (open this one)

Vite forwards every `/api/...` request from the React app to port 8000, so the sign-in cookie works without extra CORS setup. Open the browser console on the homepage to see the posts the backend returned (`Blogs from the backend: [...]`).

Other database settings can be changed with `PGUSER`, `PGHOST`, `PGPORT`, `PGDATABASE`, or `DATABASE_URL`.

## 3. Run as a single server (optional)

```powershell
npm run build   # builds React into client/dist
npm start       # Express serves the API and the built React app at http://localhost:8000
```

## API routes

Every route sends and receives JSON. Errors look like `{ "error": "message" }`.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/session` | none | `{ user }` for the signed-in user, or `null` |
| POST | `/api/signup` | none | Create an account (`user_id`, `name`, `password`); 409 if the ID is taken |
| POST | `/api/signin` | none | Check the password hash against the database and start a session |
| POST | `/api/logout` | none | End the session |
| GET | `/api/blogs` | none | All posts, newest first. Each post includes `canEdit` |
| GET | `/api/blogs/:id` | none | One post |
| POST | `/api/blogs` | signed in | Create a post (`title`, `content`) |
| PUT | `/api/blogs/:id` | creator only | Update a post; 403 if you did not write it |
| DELETE | `/api/blogs/:id` | creator only | Delete a post; 403 if you did not write it |

`canEdit` tells React whether to show the Edit and Delete buttons on a post. The backend checks ownership again on every edit and delete, so hiding the buttons is not the only safeguard.

## How the pages map to the assignment

- **Sign up / Sign in (Step 4):** same layout as the old EJS pages. The forms send their values to the backend, the backend checks them against the database, and the page shows the backend's success or error message.
- **Post creation (Step 5):** `BlogPostForm` keeps `title` and `content` in state, binds them with `value` and `onChange`, and its submit handler calls `preventDefault()` before sending the post. The new post goes to the top of the list without a page reload.
- **Post viewing (Step 6):** `PostList` uses `.map()` to show each post's title, body, author, and date. Edit and Delete appear on your own posts.
- **Post editing (Step 7):** clicking Edit shows `EditPostForm` inside that post's card, pre-filled from the `post` prop. After you save, the updated post replaces the old one in the list.
- **Post deletion (Step 8):** asks for confirmation, sends `DELETE`, and removes the post from the list once the backend confirms.
- **Styling (Step 9):** reuses the Mini-Project-1 stylesheet (`client/src/index.css`), with responsive layouts at 780px and 440px.

## Manual test checklist (Step 10)

Check each item in a desktop browser and at phone width (DevTools device toolbar, or a real phone on the same network after running `npx vite --host` in `client/`):

- [ ] Signed out: feed loads, no Edit/Delete buttons, composer shows "Sign in to write"
- [ ] Sign up with a new ID → redirected to Sign in with a success message; signing up again with the same ID shows an error
- [ ] Wrong password shows an error; correct password returns to the homepage with "Hi, name"
- [ ] Publish a post → it appears at the top immediately
- [ ] Edit your post → form is pre-filled; Save updates the card in place; Cancel discards changes
- [ ] Posts by other users show no Edit/Delete buttons
- [ ] Delete your post → it disappears and stays gone after a refresh
- [ ] Sign out → Edit/Delete buttons disappear
