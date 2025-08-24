import app from "../index";

console.log("[DEBUG] src/api/index.ts loaded");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

if (require.main === module) {
  console.log("[DEBUG] require.main === module block entered");
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[DEBUG] Server is running on port ${PORT}`);
  });
}

export default app;
