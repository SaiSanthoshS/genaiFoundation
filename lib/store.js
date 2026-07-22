const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_STATE = { members: [], selection: null };

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
  }
}

// A tiny in-process write queue so concurrent requests don't clobber
// each other's writes (good enough for a single-instance demo app;
// swap for a real database if you deploy this for real concurrent use).
let writeQueue = Promise.resolve();

function readState() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      selection: parsed.selection || null
    };
  } catch (e) {
    console.error("Failed to read db.json, resetting to default state:", e.message);
    return { ...DEFAULT_STATE };
  }
}

function writeState(state) {
  ensureDb();
  writeQueue = writeQueue.then(
    () => fs.promises.writeFile(DB_FILE, JSON.stringify(state, null, 2))
  );
  return writeQueue;
}

// Convenience helper: load, mutate, save, return the new state.
async function update(mutatorFn) {
  const state = readState();
  const result = mutatorFn(state) || state;
  await writeState(state);
  return { state, result };
}

module.exports = { readState, writeState, update };
