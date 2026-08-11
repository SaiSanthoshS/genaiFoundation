// Thin wrapper around the Flask backend's REST API using axios.
// Every function returns response.data directly, or throws an Error whose
// message is the backend's { error: "..." } string (with a sensible
// fallback if the backend is unreachable).
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const client = axios.create({ baseURL: API_BASE_URL });

function unwrap(promise) {
  return promise.then((res) => res.data).catch((err) => {
    const message = err.response?.data?.error || err.message || "Something went wrong.";
    throw new Error(message);
  });
}

export const saveLocation = (placeName, radiusKm) =>
  unwrap(client.post("/location", { place_name: placeName, radius_km: radiusKm }));

export const getLocation = () => unwrap(client.get("/location"));

export const getAlerts = () => unwrap(client.get("/alerts"));

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap(
    client.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const sendChatMessage = (question) => unwrap(client.post("/chat", { question }));

export const saveApiKey = (apiKey) => unwrap(client.post("/apikey", { api_key: apiKey }));

export const getApiKeyStatus = () => unwrap(client.get("/apikey"));
