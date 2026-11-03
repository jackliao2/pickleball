// Room service for online matches on vspickleball.com.
//
// A room is one Durable Object holding at most two WebSockets, tagged "host" and
// "guest". It forwards every text message from one to the other and announces
// joins and leaves. The players use it to exchange WebRTC offers, answers and
// ICE candidates, then talk directly; if their networks will not allow a direct
// connection the game keeps sending its messages through here instead.
//
// When both players are in, the room also hands them short-lived credentials
// for Cloudflare's TURN relay (if TURN_KEY_ID and TURN_KEY_API_TOKEN are set as
// secrets), so players behind carrier NAT still get a UDP route through the
// nearest Cloudflare location instead of falling back to this WebSocket.
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

const edgeOf = (ws) => {
  try {
    return ws?.deserializeAttachment()?.edge || "";
  } catch {
    return "";
  }
};

export class Room extends DurableObject {
  async fetch(request) {
    const params = new URL(request.url).searchParams;
    const role = params.get("role") === "host" ? "host" : "guest";
    const other = role === "host" ? "guest" : "host";
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ edge: (params.get("edge") || "").slice(0, 8) });

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
        // Finish the handshake first; the announcement follows once credentials are in.
        this.announce().catch(() => {});
      } else {
        json(server, { type: "waiting" });
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Tell both players they can start connecting, with TURN credentials and where everyone is. */
  async announce() {
    const [ice, room] = await Promise.all([this.iceServers(), this.colo()]);
    const host = this.ctx.getWebSockets("host")[0];
    const guest = this.ctx.getWebSockets("guest")[0];
    const msg = { type: "peer-joined", ice, room, edges: { host: edgeOf(host), guest: edgeOf(guest) } };
    for (const ws of [host, guest]) if (ws) json(ws, msg);
  }

  async iceServers() {
    const { TURN_KEY_ID, TURN_KEY_API_TOKEN } = this.env;
    if (!TURN_KEY_ID || !TURN_KEY_API_TOKEN) return null;
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate-ice-servers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TURN_KEY_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ttl: 4 * 3600 }),
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) return null;
      const { iceServers } = await res.json();
      if (!Array.isArray(iceServers)) return null;
      // Browsers block port 53, and a URL that can only time out slows ICE down.
      return iceServers
        .map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) }))
        .filter((s) => s.urls.length);
    } catch {
      return null;
    }
  }

  /** The Cloudflare location this room runs in, e.g. "HKG". */
  async colo() {
    if (this.where !== undefined) return this.where;
    try {
      const text = await (await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(1500) })).text();
      this.where = (text.match(/^colo=(\w+)$/m) || [])[1] || "";
    } catch {
      this.where = "";
    }
    return this.where;
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
    // Which Cloudflare location this player came in through, for the connection report.
    url.searchParams.set("edge", request.cf?.colo || "");
    const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
    return stub.fetch(new Request(url, request));
  },
};
