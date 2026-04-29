const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'GitHub Actions Security Gates Demo - Code Vulnerability Test',
    status: 'running',
    version: '1.0.0',
    scenario: 'testing-code-vulnerabilities'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', (req, res) => {
  // TODO: Add authentication check
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  res.json(users);
});

// SECURITY-ISSUE: Hardcoded credentials (for demo scanning purposes)
const API_KEY = 'hardcoded-api-key-123';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // VULNERABILITY: No input validation (for demo scanning purposes)
  if (username && password) {
    res.json({ 
      token: 'demo-token',
      message: 'Login successful'
    });
  } else {
    res.status(400).json({ error: 'Missing credentials' });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app, server };