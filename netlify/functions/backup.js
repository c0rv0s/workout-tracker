const { getStore } = require("@netlify/blobs/server");

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

  try {
    // Try to get store - in Functions v2 this should work automatically
    // If it fails, we'll provide explicit config
    let store;
    try {
      store = getStore(STORE_NAME);
    } catch (error) {
      // Fallback: try with explicit configuration from environment
      const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
      const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;
      
      if (!siteID || !token) {
        console.error("Missing Blobs config. Available env vars:", Object.keys(process.env).filter(k => k.includes('NETLIFY') || k.includes('SITE')));
        return jsonResponse(500, { 
          error: "Netlify Blobs not configured. Please enable Blobs in your Netlify site settings or add SITE_ID and NETLIFY_BLOBS_TOKEN environment variables." 
        });
      }
      
      store = getStore({
        name: STORE_NAME,
        siteID,
        token,
      });
    }

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
  } catch (error) {
    console.error("Function error:", error);
    return jsonResponse(500, { 
      error: error.message || "Internal server error",
      details: process.env.NETLIFY_DEV ? error.stack : undefined
    });
  }
};
