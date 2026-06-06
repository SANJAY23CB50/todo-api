const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const PORT = 8080;
const JWT_SECRET = 'your-strong-secret-key-change-in-production';

// Use SQLite via JSON file (simplest "database")
const DB_FILE = path.join(__dirname, 'db.json');

// Helper: read/write DB
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const data = { users: [], todos: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return data;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());

// ===== USER REGISTRATION =====
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const db = readDB();
  const userExists = db.users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  const user = { id: userId, name, email, passwordHash };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// ===== USER LOGIN =====
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// ===== AUTH MIDDLEWARE =====
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// ===== CREATE TODO =====
app.post('/todos', authMiddleware, (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const db = readDB();
  const todo = {
    id: Date.now(),
    title,
    description: description || '',
    userId: req.userId
  };

  db.todos.push(todo);
  writeDB(db);

  res.json({ id: todo.id, title: todo.title, description: todo.description });
});

// ===== GET TODOS (paginated) =====
app.get('/todos', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const db = readDB();
  const userTodos = db.todos.filter(t => t.userId === req.userId);
  const total = userTodos.length;
  const data = userTodos.slice(skip, skip + limit).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description
  }));

  res.json({ data, page, limit, total });
});

// ===== UPDATE TODO =====
app.put('/todos/:id', authMiddleware, (req, res) => {
  const todoId = parseInt(req.params.id);
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const db = readDB();
  const todo = db.todos.find(t => t.id === todoId);

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  if (todo.userId !== req.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  todo.title = title;
  todo.description = description || '';
  writeDB(db);

  res.json({ id: todo.id, title: todo.title, description: todo.description });
});

// ===== DELETE TODO =====
app.delete('/todos/:id', authMiddleware, (req, res) => {
  const todoId = parseInt(req.params.id);

  const db = readDB();
  const todoIndex = db.todos.findIndex(t => t.id === todoId);

  if (todoIndex === -1) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  const todo = db.todos[todoIndex];
  if (todo.userId !== req.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  db.todos.splice(todoIndex, 1);
  writeDB(db);

  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});