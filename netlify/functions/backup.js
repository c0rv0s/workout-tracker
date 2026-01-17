import { getStore } from "@netlify/blobs";

const STORE_NAME = "rotation-backups";
const MAX_KEY_LENGTH = 64;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Functions v2 format - uses Request/Response API
export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // In Functions v2, getStore automatically gets credentials from Netlify
  const store = getStore(STORE_NAME);

  if (request.method === "GET") {
    const url = new URL(request.url);
    const key = normalizeKey(url.searchParams.get("key") || "");
    
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

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
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

  return jsonResponse(405, { error: "Method not allowed.", method: request.method });
}
