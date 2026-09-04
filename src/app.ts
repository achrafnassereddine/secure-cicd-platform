import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be provided and contain at least 32 characters');
}

export const db = new Database(process.env.DB_PATH ?? ':memory:');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'admin'))
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL
  );
`);

const existing = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
if (existing.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)');
  insertUser.run(1, 'alice', 'demo-only-hash-alice', 'user');
  insertUser.run(2, 'bob', 'demo-only-hash-bob', 'user');
  insertUser.run(3, 'admin', 'demo-only-hash-admin', 'admin');
  const insertDoc = db.prepare('INSERT INTO documents (id, owner_id, title, body) VALUES (?, ?, ?, ?)');
  insertDoc.run(101, 1, 'Alice roadmap', 'Internal roadmap for Alice.');
  insertDoc.run(102, 2, 'Bob notes', 'Internal notes for Bob.');
}

type AuthedRequest = Request & { user?: { id: number; username: string; role: 'user' | 'admin' } };

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb' }));

const loginSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) });
const documentSchema = z.object({ title: z.string().min(1).max(120), body: z.string().min(1).max(5000) });

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'authentication required' });
  try {
    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET as string) as { sub: string; username: string; role: 'user' | 'admin' };
    req.user = { id: Number(payload.sub), username: payload.username, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid request' });
  const user = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?').get(parsed.data.username) as
    | { id: number; username: string; password_hash: string; role: 'user' | 'admin' }
    | undefined;
  if (!user || parsed.data.password !== user.password_hash) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET as string, { subject: String(user.id), expiresIn: '30m' });
  res.json({ token });
});

app.get('/api/me', requireAuth, (req: AuthedRequest, res) => {
  res.json(req.user);
});

app.get('/api/documents/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const document = db.prepare('SELECT id, owner_id, title, body FROM documents WHERE id = ? AND owner_id = ?').get(id, req.user!.id);
  if (!document) return res.status(404).json({ error: 'document not found' });
  res.json(document);
});

app.post('/api/documents', requireAuth, (req: AuthedRequest, res) => {
  const parsed = documentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid request' });
  const info = db.prepare('INSERT INTO documents (owner_id, title, body) VALUES (?, ?, ?)').run(req.user!.id, parsed.data.title, parsed.data.body);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.get('/api/search', requireAuth, (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 100);
  const rows = db.prepare('SELECT id, title FROM documents WHERE title LIKE ? ORDER BY id').all(`%${q}%`);
  res.json({ results: rows });
});

app.get('/api/admin/audit', requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const rows = db.prepare('SELECT id, username, role FROM users ORDER BY id').all();
  res.json({ users: rows });
});

export function closeDb() {
  db.close();
}
