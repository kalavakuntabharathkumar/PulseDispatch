# PulseDispatch — Real-Time Rider Coordination App

A runnable starter for a delivery dispatch coordination system. Includes a React Native Expo client and a Node.js WebSocket server with optional Redis pub/sub and PostgreSQL persistence.

## Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Expo Go on a device, or Android Studio / Xcode simulator

## Start backend services
```bash
cp .env.example .env
docker compose up --build
```
The WebSocket server listens on `ws://localhost:4100`. PostgreSQL and Redis are started by Compose.

## Start mobile app
```bash
cd apps/mobile
npm install
npm run start
```
For a physical phone, replace `localhost` in `EXPO_PUBLIC_WS_URL` with your development machine's LAN IP. Create `apps/mobile/.env` with:
`EXPO_PUBLIC_WS_URL=ws://YOUR_LAN_IP:4100`

## Message protocol
Client sends JSON:
`{ "type": "dispatch:message", "room": "dispatch", "sender": "Rider 12", "text": "Need pickup update" }`
Server broadcasts `dispatch:message` events and records them in PostgreSQL. `dispatch:join` adds a client to a room.

## Routes / events
- `GET /health`
- WebSocket event `dispatch:join`
- WebSocket event `dispatch:message`
- WebSocket event `dispatch:location`

## Portfolio note
This is a learning/portfolio starter, not a production dispatch system. The scale and performance figures in the supplied description are not claimed as verified by this scaffold.
