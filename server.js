require("dotenv").config();
const path = require("path");
const express = require("express");
const apiRouter = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", apiRouter);

// Serve the static frontend
app.use(express.static(path.join(__dirname, "public")));

// Fallback to index.html for any non-API route (simple single-page app)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Basic error handler so a thrown error returns JSON instead of crashing
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Common Chapter running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — custom book metadata lookups will use fallback values.");
  }
});
