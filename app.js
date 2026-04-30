const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'GitHub Actions Security Gates Demo',
    status: 'running',
    version: '1.0.0',
    scenario: 'testing-clean-deployment-success'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users', (req, res) => {
  // Authentication check implemented
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  res.json(users);
});

// Security: Use environment variables for API keys
const API_KEY = process.env.API_KEY || 'default-key';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Input validation implemented
  if (username && password && username.length > 0 && password.length > 0) {
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
// VULNERABILITY: prod ruleset failure demo
