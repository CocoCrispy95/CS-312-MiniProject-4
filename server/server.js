const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 8000;
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'blogdb',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
    },
);
const scrypt = promisify(crypto.scrypt);
const sessionSecret = process.env.SESSION_SECRET || 'mini-project-development-session-secret';
const clientBuild = path.join(__dirname, '..', 'client', 'dist');

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set when NODE_ENV is production.');
}

app.use(express.json({ limit: '50kb' }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

const POST_ERROR = 'Please provide a title (up to 255 characters) and post (up to 4,000 characters).';

function cleanInput(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePostId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return scrypt(password, salt, 64).then((hash) =>
    `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);
}

async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, hashHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// Shapes a database row for the frontend. `canEdit` tells React whether the
// signed-in user created this post; the backend still re-checks on every change.
function toBlog(row, currentUser) {
  return {
    id: row.blog_id,
    author: row.creator_name,
    creatorUserId: row.creator_user_id,
    title: row.title,
    content: row.body,
    createdAt: row.date_created,
    canEdit: Boolean(currentUser && currentUser.userId === row.creator_user_id),
  };
}

const BLOG_COLUMNS = 'blog_id, creator_name, creator_user_id, title, body, date_created';

function readPostInput(body) {
  const title = cleanInput(body?.title);
  const content = cleanInput(body?.content);
  const valid = title && content && title.length <= 255 && content.length <= 4000;
  return valid ? { title, content } : null;
}

function requireSignIn(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  return next();
}

const api = express.Router();

// ---- Session and accounts ----

api.get('/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

api.post('/signup', async (req, res) => {
  const userId = cleanInput(req.body?.user_id);
  const name = cleanInput(req.body?.name);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!userId || !name || !password) {
    return res.status(400).json({ error: 'Please complete your user ID, name, and password.' });
  }
  if (userId.length > 255 || name.length > 255 || password.length < 8 || password.length > 128) {
    return res.status(400).json({
      error: 'Use a user ID and name up to 255 characters and a password between 8 and 128 characters.',
    });
  }

  try {
    await pool.query(
      'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
      [userId, await hashPassword(password), name],
    );
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That user ID is already taken. Please choose another one.' });
    }
    throw error;
  }

  return res.status(201).json({ message: 'Your account is ready. Please sign in.' });
});

api.post('/signin', async (req, res, next) => {
  const userId = cleanInput(req.body?.user_id);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const { rows } = await pool.query(
    'SELECT user_id, password, name FROM users WHERE user_id = $1',
    [userId],
  );
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ error: 'The user ID or password is incorrect. Please try again.' });
  }

  return req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }
    req.session.user = { userId: user.user_id, name: user.name };
    return req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }
      return res.json({ user: req.session.user });
    });
  });
});

api.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    res.clearCookie('connect.sid');
    return res.status(204).end();
  });
});

// ---- Blog posts ----

api.get('/blogs', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT ${BLOG_COLUMNS}
    FROM blogs
    ORDER BY date_created DESC, blog_id DESC
  `);
  res.json({ blogs: rows.map((row) => toBlog(row, req.session.user)) });
});

api.get('/blogs/:id', async (req, res) => {
  const id = parsePostId(req.params.id);
  const { rows } = id === null
    ? { rows: [] }
    : await pool.query(`SELECT ${BLOG_COLUMNS} FROM blogs WHERE blog_id = $1`, [id]);
  if (!rows[0]) {
    return res.status(404).json({ error: 'That post could not be found.' });
  }
  return res.json({ blog: toBlog(rows[0], req.session.user) });
});

api.post('/blogs', requireSignIn, async (req, res) => {
  const input = readPostInput(req.body);
  if (!input) {
    return res.status(400).json({ error: POST_ERROR });
  }

  const { rows } = await pool.query(`
    INSERT INTO blogs (creator_name, creator_user_id, title, body)
    VALUES ($1, $2, $3, $4)
    RETURNING ${BLOG_COLUMNS}
  `, [req.session.user.name, req.session.user.userId, input.title, input.content]);
  return res.status(201).json({ blog: toBlog(rows[0], req.session.user) });
});

// Looks up a post and confirms the signed-in user created it.
// Sends the error response itself and returns null when the check fails.
async function findOwnedPost(req, res) {
  const id = parsePostId(req.params.id);
  const { rows } = id === null
    ? { rows: [] }
    : await pool.query('SELECT creator_user_id FROM blogs WHERE blog_id = $1', [id]);
  if (!rows[0]) {
    res.status(404).json({ error: 'That post could not be found.' });
    return null;
  }
  if (rows[0].creator_user_id !== req.session.user.userId) {
    res.status(403).json({ error: 'You can only change posts that you created.' });
    return null;
  }
  return id;
}

api.put('/blogs/:id', requireSignIn, async (req, res) => {
  const id = await findOwnedPost(req, res);
  if (id === null) {
    return undefined;
  }

  const input = readPostInput(req.body);
  if (!input) {
    return res.status(400).json({ error: POST_ERROR });
  }

  const { rows } = await pool.query(`
    UPDATE blogs SET title = $1, body = $2
    WHERE blog_id = $3 AND creator_user_id = $4
    RETURNING ${BLOG_COLUMNS}
  `, [input.title, input.content, id, req.session.user.userId]);
  if (!rows[0]) {
    return res.status(404).json({ error: 'That post could not be found.' });
  }
  return res.json({ blog: toBlog(rows[0], req.session.user) });
});

api.delete('/blogs/:id', requireSignIn, async (req, res) => {
  const id = await findOwnedPost(req, res);
  if (id === null) {
    return undefined;
  }

  const result = await pool.query(
    'DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2',
    [id, req.session.user.userId],
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'That post could not be found.' });
  }
  return res.status(204).end();
});

api.use((req, res) => res.status(404).json({ error: 'Unknown API route.' }));

app.use('/api', api);

// After `npm run build`, serve the React app from the same server.
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body was not valid JSON.' });
  }
  console.error('Request failed:', error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

async function start() {
  await pool.query('SELECT 1');
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET is not set; using the development-only session secret.');
  }
  app.listen(port, () => {
    console.log(`The Blog Space API is running at http://localhost:${port}/api`);
  });
}

start().catch((error) => {
  console.error('Unable to connect to PostgreSQL. Check the database settings and schema:', error);
  process.exitCode = 1;
});
