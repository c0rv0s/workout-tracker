const { getStore } = require("@netlify/blobs");

const STORE_NAME = "rotation-backups";
const MAX_KEY_LENGTH = 64;

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

function normalizeKey(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, MAX_KEY_LENGTH);
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: baseHeaders,
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: baseHeaders,
      body: "",
    };
  }

  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const key = normalizeKey(event.queryStringParameters?.key || "");
    if (!key) {
      return jsonResponse(400, { error: "Missing backup key." });
    }

    let raw;
    try {
      raw = await store.get(key, { type: "text" });
    } catch (error) {
      console.error("Failed to read backup:", error);
      return jsonResponse(500, { error: "Failed to read backup." });
    }
    if (!raw) {
      return jsonResponse(404, { error: "Backup not found." });
    }

    try {
      const data = JSON.parse(raw);
      return jsonResponse(200, { data });
    } catch (error) {
      console.error("Failed to parse backup JSON:", error);
      return jsonResponse(500, { error: "Stored backup is corrupted." });
    }
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (error) {
      return jsonResponse(400, { error: "Invalid JSON body." });
    }

    const key = normalizeKey(body.key || "");
    if (!key) {
      return jsonResponse(400, { error: "Missing backup key." });
    }

    const data = body.data;
    if (!data || !Array.isArray(data.history)) {
      return jsonResponse(400, { error: "Invalid backup payload." });
    }

    try {
      await store.set(key, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to write backup:", error);
      return jsonResponse(500, { error: "Failed to write backup." });
    }
    return jsonResponse(200, { ok: true, savedAt: new Date().toISOString() });
  }

  return jsonResponse(405, { error: "Method not allowed." });
};
