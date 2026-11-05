import express from 'express';
import cors from 'cors';
import { createApiRouter } from '../server/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Support both /api/... and direct router endpoints
app.use('/api', createApiRouter());
app.use('/', createApiRouter());

export default app;
