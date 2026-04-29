import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.ts';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'portal-secret-key-123';

const STAGE_PROGRESS: Record<string, number> = {
  'Site Visit': 10,
  'Proposal': 20,
  'eKYC': 30,
  'Payment': 40,
  'Approvals': 50,
  'Material': 60,
  'Installation': 80,
  'Net Meter': 90,
  'Subsidy': 100,
};

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seeding standard admin if not exists
try {
  const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin User',
      'admin@example.com',
      hashedPassword,
      'admin'
    );
    console.log('Admin seeded: admin@example.com / admin123');
  }

  // Seeding dummy customer and project for preview
  const customerExists = db.prepare('SELECT * FROM users WHERE email = ?').get('customer@example.com');
  if (!customerExists) {
    const hashedPassword = bcrypt.hashSync('customer123', 10);
    const userResult = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'John Doe',
      'customer@example.com',
      hashedPassword,
      'customer'
    );
    const customerId = userResult.lastInsertRowid;

    const status = 'Installation';
    const progress = STAGE_PROGRESS[status] || 0;

    const projectResult = db.prepare(`
      INSERT INTO projects (name, description, customer_name, phone, status, progress) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      '10kW Solar System',
      'Full rooftop installation for residential property.',
      'John Doe',
      '9876543210',
      status,
      progress
    );
    const projectId = projectResult.lastInsertRowid;

    db.prepare('INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)').run(customerId, projectId);
    
    console.log('Sample customer seeded: customer@example.com / customer123');
  }
} catch (err) {
  console.error('Database initialization error:', err);
}

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

app.post('/api/auth/customer-login', (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const project = db.prepare('SELECT * FROM projects WHERE customer_name = ? AND phone = ?').get(name, phone);

    if (!project) {
      return res.status(404).json({ error: 'No project found with these details. Please contact your administrator.' });
    }

    const token = jwt.sign({
      id: `cust_${phone}`,
      name,
      phone,
      role: 'customer'
    }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      token,
      user: {
        id: `cust_${phone}`,
        name,
        phone,
        role: 'customer'
      }
    });
  } catch (err: any) {
    console.error('Customer login error:', err);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// User routes (Admin Only)
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE role = 'customer'").all();
  res.json(users);
});

app.post('/api/users', authenticateToken, isAdmin, (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, 'customer');
    res.json({ id: result.lastInsertRowid, name, email, role: 'customer' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Project routes
app.get('/api/projects', authenticateToken, (req: any, res) => {
  if (req.user.role === 'admin') {
    const projects = db.prepare(`
      SELECT p.*, GROUP_CONCAT(u.name) as assigned_customers
      FROM projects p
      LEFT JOIN user_projects up ON p.id = up.project_id
      LEFT JOIN users u ON up.user_id = u.id
      GROUP BY p.id
    `).all();
    res.json(projects);
  } else {
    // Return projects matching customer name and phone
    const projects = db.prepare(`
      SELECT *
      FROM projects
      WHERE customer_name = ? AND phone = ?
    `).all(req.user.name, req.user.phone);
    res.json(projects);
  }
});

app.post('/api/projects', authenticateToken, isAdmin, (req, res) => {
  const { name, description, customerName, phone, proposalAmount, paidAmount, advanceAmount, customerIds } = req.body;
  const initialStatus = 'Site Visit';
  const progress = STAGE_PROGRESS[initialStatus] || 10;
  
  const balanceAmount = (proposalAmount || 0) - (advanceAmount || 0) - (paidAmount || 0);

  const info = db.prepare(`
    INSERT INTO projects (name, description, customer_name, phone, proposal_amount, paid_amount, advance_amount, balance_amount, status, progress) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, 
    description || '', 
    customerName || '', 
    phone || '', 
    proposalAmount || 0, 
    paidAmount || 0, 
    advanceAmount || 0, 
    balanceAmount,
    initialStatus, 
    progress
  );
  
  const projectId = info.lastInsertRowid;

  if (customerIds && Array.isArray(customerIds)) {
    const stmt = db.prepare('INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)');
    for (const customerId of customerIds) {
      stmt.run(customerId, projectId);
    }
  }
  res.json({ id: projectId, name, description });
});

app.patch('/api/projects/:id', authenticateToken, isAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const progress = STAGE_PROGRESS[status] || 0;
  db.prepare('UPDATE projects SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, progress, id);
  res.json({ success: true, progress });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

// Final API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Final catch-all for non-API routes if not handled by static/vite
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
