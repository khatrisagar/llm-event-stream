import app from "../index";
import { VercelRequest, VercelResponse } from '@vercel/node';

console.log('API handler initialized');

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
    console.log(`Server is running on port ${PORT}`);
  });
}

// For Vercel serverless functions
module.exports = async (req: VercelRequest, res: VercelResponse) => {
  console.log('Incoming request:', req.method, req.url);
  try {
    return app(req, res);
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
