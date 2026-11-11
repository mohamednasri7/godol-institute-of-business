import express from 'express';
import cors from 'cors';
import { createApiRouter } from '../server/index.js';

const app = express();

// Disable ETags so Vercel and browsers never respond with 304 Not Modified
app.set('etag', false);

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Never cache dynamic API responses — ensure live data is always served
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Support both /api/... and direct router endpoints
app.use('/api', createApiRouter());
app.use('/', createApiRouter());

export default app;
