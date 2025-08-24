import { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../index';

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// For local development
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log(`- GET  /`);
    console.log(`- GET  /api/test`);
    console.log(`- POST /api/ask-ai`);
    console.log(`- POST /api/chat`);
  });
}

// For Vercel serverless functions
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    return app(req, res);
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
