// Room service for online matches on vspickleball.com.
//
// A room is one Durable Object holding at most two WebSockets, tagged "host" and
// "guest". It forwards every text message from one to the other and announces
// joins and leaves. The players use it to exchange WebRTC offers, answers and
// ICE candidates, then talk directly; if their networks will not allow a direct
// connection the game keeps sending its messages through here instead.
//
// Served at vspickleball.com/rooms/<CODE> by a route, so the VPS never sees it.

import { DurableObject } from "cloudflare:workers";

const CODE = /^\/rooms\/([A-HJ-NP-Z2-9]{5})$/;
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?vspickleball\.com$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const MAX_MESSAGE = 16 * 1024;

const json = (ws, msg) => {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    /* socket already closing */
  }
};

export class Room extends DurableObject {
  async fetch(request) {
    const role = new URL(request.url).searchParams.get("role") === "host" ? "host" : "guest";
    const other = role === "host" ? "guest" : "host";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);

    if (this.ctx.getWebSockets(role).length > 1) {
      // A second host would hijack the room; a third player has no seat.
      json(server, { type: role === "host" ? "taken" : "full" });
      server.close(4000, role === "host" ? "taken" : "full");
    } else if (role === "guest" && this.ctx.getWebSockets("host").length === 0) {
      json(server, { type: "no-host" });
      server.close(4001, "no-host");
    } else {
      const peer = this.ctx.getWebSockets(other)[0];
      if (peer) {
        json(peer, { type: "peer-joined" });
        json(server, { type: "peer-joined" });
      } else {
        json(server, { type: "waiting" });
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE) return;
    const [role] = this.ctx.getTags(ws);
    const peer = this.ctx.getWebSockets(role === "host" ? "guest" : "host")[0];
    if (peer) peer.send(message);
  }

  webSocketClose(ws, code) {
    const [role] = this.ctx.getTags(ws);
    // Only the first socket of a role counts; a rejected duplicate leaving is not news.
    if (this.ctx.getWebSockets(role).some((s) => s !== ws)) return;
    const peer = this.ctx.getWebSockets(role === "host" ? "guest" : "host")[0];
    if (peer) json(peer, { type: "peer-left" });
    try {
      ws.close(code === 1005 ? 1000 : code, "bye");
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws) {
    this.webSocketClose(ws, 1011);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // The game shows its online button only when this answers.
    if (url.pathname === "/rooms/health") {
      return new Response("ok", { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } });
    }
    const match = url.pathname.match(CODE);
    if (!match) return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    const origin = request.headers.get("Origin") || "";
    if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return new Response("Forbidden", { status: 403 });
    const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
    return stub.fetch(request);
  },
};
