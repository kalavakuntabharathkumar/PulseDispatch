require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const Redis = require("ioredis");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true, service: "pulsedispatch" }));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const subscriber = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const rooms = new Map();

subscriber.subscribe("pulse:events").catch(console.error);
subscriber.on("message", (_channel, raw) => {
  let event;
  try { event = JSON.parse(raw); } catch { return; }
  const room = rooms.get(event.room || "dispatch");
  if (!room) return;
  const payload = JSON.stringify(event);
  for (const client of room) if (client.readyState === WebSocket.OPEN) client.send(payload);
});

function join(client, roomName) {
  const name = String(roomName || "dispatch").slice(0, 80);
  if (!rooms.has(name)) rooms.set(name, new Set());
  rooms.get(name).add(client);
  client.room = name;
}
wss.on("connection", (client) => {
  join(client, "dispatch");
  client.on("message", async (raw) => {
    let event;
    try { event = JSON.parse(raw.toString()); } catch { client.send(JSON.stringify({ type: "error", message: "Invalid JSON" })); return; }
    if (event.type === "dispatch:join") { join(client, event.room); client.send(JSON.stringify({ type: "dispatch:joined", room: client.room })); return; }
    if (event.type === "dispatch:message") {
      const room = String(event.room || client.room || "dispatch").slice(0, 80);
      const sender = String(event.sender || "Anonymous").slice(0, 80);
      const message = String(event.text || "").trim().slice(0, 2000);
      if (!message) return;
      try { await pool.query("INSERT INTO dispatch_messages(room, sender, message) VALUES($1, $2, $3)", [room, sender, message]); }
      catch (error) { console.error("Message persistence failed:", error.message); }
      const payload = { type: "dispatch:message", room, sender, text: message, sentAt: new Date().toISOString() };
      await redis.publish("pulse:events", JSON.stringify(payload));
    }
    if (event.type === "dispatch:location") {
      const riderId = String(event.riderId || "").slice(0, 80);
      const latitude = Number(event.latitude), longitude = Number(event.longitude);
      if (!riderId || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
      await pool.query("INSERT INTO rider_locations(rider_id, latitude, longitude) VALUES($1,$2,$3) ON CONFLICT(rider_id) DO UPDATE SET latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, updated_at=NOW()", [riderId, latitude, longitude]);
      await redis.publish("pulse:events", JSON.stringify({ type: "dispatch:location", room: client.room || "dispatch", riderId, latitude, longitude, sentAt: new Date().toISOString() }));
    }
  });
  client.on("close", () => { for (const set of rooms.values()) set.delete(client); });
});
const port = Number(process.env.PORT) || 4100;
server.listen(port, () => console.log(`PulseDispatch server listening on ${port}`));
