// test-server.js
const express = require('express');
const app = express();

app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running'
  });
});

// Try importing actual tournaments routes
try {
  const actualTournamentsRouter = require('./src/api/tournaments/routes');
  app.use('/api/tournaments', actualTournamentsRouter);
  console.log('Successfully loaded tournaments routes');
} catch (error) {
  console.error('Error loading tournaments routes:', error.message);
  // Use simple routes as fallback
  const tournamentsRouter = express.Router();
  tournamentsRouter.get('/featured', (req, res) => {
    res.json({ message: 'Featured tournaments endpoint (fallback)' });
  });
  tournamentsRouter.get('/upcoming', (req, res) => {
    res.json({ message: 'Upcoming tournaments endpoint (fallback)' });
  });
  app.use('/api/tournaments', tournamentsRouter);
}

// Try importing actual auth routes
try {
  const actualAuthRouter = require('./src/api/auth/routes');
  app.use('/api/auth', actualAuthRouter);
  console.log('Successfully loaded auth routes');
} catch (error) {
  console.error('Error loading auth routes:', error.message);
  // Use simple routes as fallback
  const authRouter = express.Router();
  authRouter.post('/register', (req, res) => {
    res.json({ message: 'Register endpoint (fallback)', body: req.body });
  });
  authRouter.post('/login', (req, res) => {
    res.json({ message: 'Login endpoint (fallback)', body: req.body });
  });
  app.use('/api/auth', authRouter);
}

// Try importing actual bets routes
try {
  const actualBetsRouter = require('./src/api/bets/routes');
  app.use('/api/bets', actualBetsRouter);
  console.log('Successfully loaded bets routes');
} catch (error) {
  console.error('Error loading bets routes:', error.message);
  // Use simple routes as fallback
  const betsRouter = express.Router();
  betsRouter.get('/active', (req, res) => {
    res.json({ message: 'Active bets endpoint (fallback)' });
  });
  app.use('/api/bets', betsRouter);
}

// Try importing actual wallet routes
try {
  const actualWalletRouter = require('./src/api/wallet/routes');
  app.use('/api/wallet', actualWalletRouter);
  console.log('Successfully loaded wallet routes');
} catch (error) {
  console.error('Error loading wallet routes:', error.message);
  // Use simple routes as fallback
  const walletRouter = express.Router();
  walletRouter.get('/balance', (req, res) => {
    res.json({ message: 'Wallet balance endpoint (fallback)' });
  });
  app.use('/api/wallet', walletRouter);
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});