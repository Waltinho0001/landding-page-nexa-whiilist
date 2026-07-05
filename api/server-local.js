/**
 * api/server-local.js
 * Local API Express server to run Vercel serverless functions locally.
 * Referenced by frontend/README.md
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import handlers
import registerHandler from './register.js';
import statusHandler from './status.js';
import exportHandler from './admin/export.js';
import listHandler from './admin/list.js';
import statsHandler from './admin/stats.js';
import unsubscribeHandler from './user/unsubscribe.js';

// Map routes to Vercel handlers
app.post('/api/register', registerHandler);
app.get('/api/status', statusHandler);
app.get('/api/admin/export', exportHandler);
app.get('/api/admin/list', listHandler);
app.get('/api/admin/stats', statsHandler);
app.post('/api/user/unsubscribe', unsubscribeHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(port, () => {
  console.log(`Local API Server running at http://localhost:${port}`);
});
