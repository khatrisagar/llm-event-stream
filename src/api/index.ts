import app from "../index";
import { VercelRequest, VercelResponse } from '@vercel/node';

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// For Vercel serverless functions
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
